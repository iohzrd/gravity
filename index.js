const dragDrop = require('drag-drop');
const electronConfig = require('electron-config');
const fs = require('fs-extra');
const path = require('path');
const sortableJs = require('sortablejs');
const ytdl = require('ytdl-core');
const {
	ipcRenderer,
	remote,
} = require('electron');

const config = new electronConfig();
const configPath = path.dirname(config.path);
const tempPath = `${configPath}/Temp`;
if (!fs.existsSync(tempPath)) {
	fs.mkdirSync(tempPath);
}


function refresh() {
	ipcRenderer.send('refresh');
}

function toHHMMSS(seconds) {
	const date = new Date(seconds * 1000);
	let hh = date.getUTCHours();
	let mm = date.getUTCMinutes();
	let ss = date.getSeconds();
	if (hh < 10) {
		hh = `0${hh}`;
	}
	if (mm < 10) {
		mm = `0${mm}`;
	}
	if (ss < 10) {
		ss = `0${ss}`;
	}
	return `${hh}:${mm}:${ss}`;
}


function deleteEntry(uid) {
	const root = config.get();

	for (let i = 0; i < root.cards.length; i++) {
		const card = root.cards[i];
		if (card.uid === uid) {
			try {
				fs.unlinkSync(card.path);
			} catch (error) {
				console.log('File missing.');
			}
			root.cards.splice(i, 1);
		}
	}
	config.set(root);
	const col = document.getElementById(`col-${uid}`);
	col.parentNode.removeChild(col);
	const modal = document.getElementById(`modal-${uid}`);
	const instance = M.Modal.getInstance(modal);
	instance.close();
	instance.destroy();
	modal.parentNode.removeChild(modal);
	refresh();
}


function saveEntry(uid) {
	console.log(uid);
	const modalName = document.getElementById(`modal-name-${uid}`);
	const modalRate = document.getElementById(`modal-rate-value-${uid}`);
	const modalVolume = document.getElementById(`modal-volume-value-${uid}`);
	const cardTitle = document.getElementById(`card-title-${uid}`);
	const root = config.get();
	root.cards.forEach((element) => {
		if (element.uid === uid) {
			const index = root.cards.indexOf(element);
			cardTitle.innerText = modalName.value;
			root.cards[index].name = modalName.value;
			root.cards[index].rate = Number(modalRate.innerText);
			root.cards[index].volume = Number(modalVolume.innerText);
		}
	});
	config.set(root);
}

function saveFiles(files) {
	const fileType = require('file-type');
	const readChunk = require('read-chunk');
	const arr = [];
	console.log(files);

	for (let index = 0; index < files.length; index++) {
		const file = files[index];
		console.log(file.path);
		if (file.path) {
			console.log(file.path);
			arr.push(file.path);
		} else {
			const buffer = fileType(readChunk.sync(file, 0, 4100));
			console.log(buffer);
			if (buffer.mime.includes('audio/')) {
				arr.push(file);
			}
		}
	}

	if (arr.length > 0) {
		ipcRenderer.send('saveFile', arr);
		refresh();
	}
}

async function updateTimeSlider(input) {
	try {
		const videoMeta = await ytdl.getInfo(input.value);
		const slider = document.getElementById('form-link-slider');

		if (!slider.noUiSlider) {
			noUiSlider.create(slider, {
				start: [0, Number(videoMeta.length_seconds)],
				step: 1,
				range: {
					min: 0,
					max: Number(videoMeta.length_seconds),
				},
			});
		} else {
			slider.noUiSlider.updateOptions({
				start: [0, Number(videoMeta.length_seconds)],
				range: {
					min: 0,
					max: Number(videoMeta.length_seconds),
				},
			});
		}

		slider.noUiSlider.on('update', (values, handle) => {
			document.getElementById('form-link-slider-start').innerHTML = toHHMMSS(values[0]);
			document.getElementById('form-link-slider-start-seconds').innerHTML = values[0];
			document.getElementById('form-link-slider-end').innerHTML = toHHMMSS(values[1]);
			document.getElementById('form-link-slider-end-seconds').innerHTML = values[1];
		});
	} catch (error) {
		console.log(error);
	}
}

async function startDownload(id) {
	const ffmpeg = require('ffmpeg-binaries');
	// const ffmpeg = require('ffmpeg-static');
	const fluent = require('fluent-ffmpeg');
	const sanitize = require('sanitize-filename');
	const progressBar = document.getElementById('form-link-progress');
	const start = document.getElementById('form-link-slider-start-seconds').innerHTML;
	const endTime = document.getElementById('form-link-slider-end-seconds').innerHTML;
	const duration = Number(endTime) - Number(start);

	try {
		const info = await ytdl.getInfo(id);
		console.log(info);
		const paths = await new Promise((resolve, reject) => {
			const fullPath = path.join(tempPath, 'tmp.mp4');
			const videoObject = ytdl(id, {
				// filter: 'audioonly',
			});
			videoObject
				.on('progress', (chunkLength, downloaded, total) => {
					progressBar.style = `width: ${Math.floor((downloaded / total) * 49)}%`;
				});

			videoObject
				.pipe(fs.createWriteStream(fullPath))
				.on('finish', () => {
					progressBar.style = 'width: 50%';
					setTimeout(() => {
						resolve({
							filePath: fullPath,
							folderPath: tempPath,
							fileTitle: `${info.title}.wav`,
						});
					}, 1000);
				});
		});

		require('hazardous');
		await new Promise((resolve, reject) => {
			// ffmpeg.ffmpegPath();
			fluent(paths.filePath)
				.setStartTime(start)
				.setDuration(duration)
				.setFfmpegPath(ffmpeg.ffmpegPath())
				.format('wav')
				// .audioBitrate(192)
				.on('progress', (progress) => {
					progressBar.style = `width: ${50 + Math.floor(progress.percent / 2)}%`;
				})
				.output(fs.createWriteStream(path.join(paths.folderPath, sanitize(paths.fileTitle))))
				.on('end', () => {
					progressBar.style = 'width: 100%';
					resolve();
				})
				.audioFilters([
					{
						filter: 'volume',
						options: ['1.0']
					},
					{
						filter: 'dynaudnorm',
						// options: { n: '-50dB', d: 5 }
					},
					// {
					// 	filter: 'loudnorm',
					// 	options: { i: -23.0, lra: 7, tp: -2.0 }
					// }
				])
				.run();
		});

		saveFiles([path.join(paths.folderPath, paths.fileTitle)]);
		// fs.unlinkSync(paths.filePath);
		// fs.unlinkSync(path.join(paths.folderPath, paths.fileTitle));
	} catch (e) {
		console.error(e);
	}
}


function submit() {
	if (document.getElementById('form-link').disabled) {
		saveFiles(document.getElementById('form-files').files);
	} else {
		startDownload(document.getElementById('form-link').value);
	}
	// const modal = document.getElementById('modal-select-input-type');
	// const instance = M.Modal.getInstance(modal);
	//   instance.close();
}


function playPause(uid) {
	const element = document.getElementById(`audio-${uid}`);
	if (element.paused) {
		element.play();
	} else {
		element.pause();
	}
}

function reset(uid) {
	const element = document.getElementById(`audio-${uid}`);
	element.pause();
	element.currentTime = 0;
}

function updateProgress(audio) {
	const uid = audio.id.replace('audio-', '');
	const percent = Math.floor((audio.currentTime / audio.duration) * 100);
	const determinate = document.getElementById(`determinate-${uid}`);
	if (percent === 100) {
		determinate.style.width = '0%';
	} else {
		determinate.style.width = `${percent}%`;
	}
}


const cards = document.getElementById('cards');
const sortable = sortableJs.create(cards, {
	animation: 100,
	handle: '.material-icons left',
	group: 'cards',
	onEnd(evt) {
		const root = config.get();
		const z = root.cards[evt.oldIndex];
		root.cards.splice(evt.oldIndex, 1);
		root.cards.splice(evt.newIndex, 0, z);
		config.set(root);
	},
});


dragDrop('body', {
	onDrop(files, pos) {
		console.log(files);
		saveFiles(files);
	},
	// onDragEnter() {
	//   console.log('dragDrop.onDragEnter');
	//   const elem = document.getElementById('modal-drag-drop');
	//   M.Modal.init(elem, {});
	//   const instance = M.Modal.getInstance(elem);
	//   instance.open();
	// },
	// onDragOver() {
	//   console.log('dragDrop.onDragOver');
	// },
	// onDragLeave() {
	//   console.log('dragDrop.onDragLeave');
	//   const elem = document.getElementById('modal-drag-drop');
	//   const instance = M.Modal.getInstance(elem);

	//   const cards = document.getElementById('cards');
	//   console.log(cards);

	//   // instance.close();
	//   // instance.destroy();
	// },
});

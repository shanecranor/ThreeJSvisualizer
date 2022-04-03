import * as THREE from 'three';

import Stats from './jsm/libs/stats.module.js';

import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';

let camera, scene, renderer, models, stats, source;
let FFT_SIZE = 32
const clock = new THREE.Clock();

let mixer;
//audio init stuff
//Connects the audio source to the analyser and creating a suitably sized array to hold the frequency data.
function createAudioObjects() {
	source = context.createMediaElementSource(document.getElementById("sound"));
	source.connect(analyser);
	analyser.connect(context.destination);
	analyser.fftSize = FFT_SIZE; //128, 256, 512, 1024 and 2048 are valid values.
	let bufferLength = analyser.frequencyBinCount;
	soundDataArray = new Uint8Array(bufferLength);
}

let context = new (window.AudioContext || window.webkitAudioContext)();
let analyser = context.createAnalyser();
let soundDataArray;
let audioInput = document.getElementById('audioInput')
audioInput.onchange = function() {
	let sound = document.getElementById("sound");
	let reader = new FileReader();
	reader.onload = function(e) {
	  sound.src = this.result;
	  sound.controls = true;
	  sound.play();
	  
	};
	reader.readAsDataURL(this.files[0]);
	createAudioObjects();
	document.getElementById('audioInput').style.visibility = 'hidden';
	document.getElementById('audioInputLabel').style.visibility = 'hidden';
};

init();
animate();

function getSampleOfSoundData(index, noSampleSections, soundDataArray){
	let sampleSize = Math.floor((soundDataArray.length/2) / noSampleSections); 
	//Note division by 2. I think I accidently initalize the soundDataArray as twice as long as it needs to be?
	let minBound = index * sampleSize; 
	let maxBound = (index + 1) * sampleSize;
	let sum = 0;

	for (let i = minBound; i < maxBound; i++){
		sum += soundDataArray[i];
	}
	let average = sum / sampleSize;

	return average / MAX_SOUND_VALUE;
}

function setupModel(data) {
	const model = data.scene;
	return model;
}

async function loadModels(){
	const loader = new GLTFLoader();
	const [carData, treeData, toolData] = await Promise.all([
		loader.loadAsync('models/car.glb'),
		loader.loadAsync('models/tree.glb'),
		loader.loadAsync('models/toolHoe.glb')
	]);
	models = new Object();
	models.car = setupModel(carData);
	models.tree = setupModel(treeData);
	models.tool = setupModel(toolData);
	return models;
}
async function init() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
	camera.position.set( 100, 200, 300 );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xa0a0a0 );
	// scene.fog = new THREE.Fog( 0xa0a0a0, 200, 1000 );

	const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
	hemiLight.position.set( 0, 200, 0 );
	scene.add( hemiLight );

	const dirLight = new THREE.DirectionalLight( 0xffffff );
	dirLight.position.set( 0, 200, 100 );
	dirLight.castShadow = true;
	dirLight.shadow.camera.top = 180;
	dirLight.shadow.camera.bottom = - 100;
	dirLight.shadow.camera.left = - 120;
	dirLight.shadow.camera.right = 120;
	scene.add( dirLight );

	// ground
	const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
	mesh.rotation.x = - Math.PI / 2;
	mesh.receiveShadow = true;
	scene.add( mesh );

	const grid = new THREE.GridHelper( 2000, 20, 0x000000, 0x000000 );
	grid.material.opacity = 0.2;
	grid.material.transparent = true;
	scene.add( grid );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );

	const controls = new OrbitControls( camera, renderer.domElement );
	controls.target.set( 0, 100, 0 );
	controls.update();

	//add models

	models = await loadModels();
	models.car.scale.setScalar( 60 );
	models.tree.scale.setScalar( 40 );
	models.tree.position.z = -120;
	let treeSpace = 80
	models.tree.position.x = -treeSpace*FFT_SIZE/4;
	models.tool.scale.setScalar( 60 );
	models.tool.position.z = 120;
	for (const model in models){
		if(model == "tree"){
			for(let i = 0; i < FFT_SIZE/2; i++){
				models[model+"_"+i] = models[model].clone()
				models[model+"_"+i].position.x += treeSpace*i;
				scene.add(models[model+"_"+i])
			}
		} else {
			scene.add(models[model])
		}
	}

	window.addEventListener( 'resize', onWindowResize );

	// stats
	//stats = new Stats();

}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

//

function animate() {
	requestAnimationFrame( animate );
	const delta = clock.getDelta();
	if ( mixer ) mixer.update( delta );
	//get new audio info
	if((soundDataArray === undefined) == false){
		analyser.getByteFrequencyData(soundDataArray);
		models.car.scale.y = (soundDataArray[8]/256)*60
		for(let i = 0; i < FFT_SIZE/2; i++){
			models["tree_"+i].scale.y = (soundDataArray[i]/256)*60
		}
	}
	//do graphics update 
	if(models){
		models.car.rotation.y +=0.01;
		models.tree.scale.y = (Math.sin(clock.elapsedTime*10+Math.PI)*10)+60
	}
	
	
	renderer.render( scene, camera );
	//stats.update();
}
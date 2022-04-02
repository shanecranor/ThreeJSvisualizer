import * as THREE from 'three';

import Stats from './jsm/libs/stats.module.js';

import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';

let camera, scene, tree, renderer, stats;

const clock = new THREE.Clock();

let mixer;

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

function init() {

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

	// scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

	//audio stuff yellow bars
	// const listener = new THREE.AudioListener();
	// const audio = new THREE.Audio( listener );
	// const file = 'dialstoned.mp3';
	// const mediaElement = new Audio( file );
	// function playAudio(){
	// 	mediaElement.play();
	// }

	// audio.setMediaElementSource( mediaElement );
	// analyser = new THREE.AudioAnalyser( audio, 128 );
	// uniforms = {
	// 	tAudioData: { value: new THREE.DataTexture( analyser.data, fftSize / 2, 1, format ) }

	// };

	// ground
	const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
	mesh.rotation.x = - Math.PI / 2;
	mesh.receiveShadow = true;
	scene.add( mesh );

	const grid = new THREE.GridHelper( 2000, 20, 0x000000, 0x000000 );
	grid.material.opacity = 0.2;
	grid.material.transparent = true;
	scene.add( grid );


	// model
	const loader = new GLTFLoader();
	loader.load( 'models/Model/tree.glb',
		function ( gltf ) {
			gltf.scene.scale.multiplyScalar(40.0)
			tree = gltf.scene
			scene.add( tree );
			gltf.animations; // Array<THREE.AnimationClip>
			gltf.scene; // THREE.Group
			gltf.scenes; // Array<THREE.Group>
			gltf.cameras; // Array<THREE.Camera>
			gltf.asset; // Object
		},
		// called while loading is progressing
		function ( xhr ) {
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		},
		// called when loading has errors
		function ( error ) {
			console.log( 'An error happened' );
		}
	);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );

	const controls = new OrbitControls( camera, renderer.domElement );
	controls.target.set( 0, 100, 0 );
	controls.update();

	window.addEventListener( 'resize', onWindowResize );

	// stats
	stats = new Stats();
	container.appendChild( stats.dom );

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
	tree.scale.y = (Math.sin(clock.elapsedTime*5)*10)+60

	//uniforms.tAudioData.value.needsUpdate = true;

	renderer.render( scene, camera );
	stats.update();
}
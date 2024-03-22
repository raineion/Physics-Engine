/// <reference path="_reference.ts"/>

/* 
MAIN GAME FILE
Source file	name:       game.ts
Author’s name:	        George Savcheko and Jason Gunter
Last modified by:       George Savchenko
Date last modified:     2016-03-25
Program	description:    Create your own simple First Person Perspective game. The game must include hazards for the player to avoid. A scoring
                        system must also be included. You must build your own graphic and sound assets. You must use ThreeJS and a JavaScript 
                        Physics Engine to build your game. 
Revision history:       renamed game and updated game design document
THREEJS Aliases
*/
import Scene = Physijs.Scene;
import Renderer = THREE.WebGLRenderer;
import PerspectiveCamera = THREE.PerspectiveCamera;
import BoxGeometry = THREE.BoxGeometry;
import CubeGeometry = THREE.CubeGeometry;
import PlaneGeometry = THREE.PlaneGeometry;
import SphereGeometry = THREE.SphereGeometry;
import Geometry = THREE.Geometry;
import AxisHelper = THREE.AxisHelper;
import LambertMaterial = THREE.MeshLambertMaterial;
import MeshBasicMaterial = THREE.MeshBasicMaterial;
import Material = THREE.Material;
import Mesh = THREE.Mesh;
import Object3D = THREE.Object3D;
import SpotLight = THREE.SpotLight;
import PointLight = THREE.PointLight;
import AmbientLight = THREE.AmbientLight;
import Control = objects.Control;
import GUI = dat.GUI;
import Color = THREE.Color;
import Vector3 = THREE.Vector3;
import Face3 = THREE.Face3;
import Point = objects.Point;
import CScreen = config.Screen;
import Clock = THREE.Clock;

//Custom Game Objects
import gameObject = objects.gameObject;

// Setup a Web Worker for Physijs
Physijs.scripts.worker = "/Scripts/lib/Physijs/physijs_worker.js";
Physijs.scripts.ammo = "/Scripts/lib/Physijs/examples/js/ammo.js";


// Setup an IIFE structure (Immediately Invoked Function Expression)
var game = (() => {
    
    // Declare game objects    
    // HTML Elements
    var havePointerLock: boolean;
    var element: any;
    var blocker: HTMLElement;
    var instructions: HTMLElement;
    
    // Scene objects
    var scene: Scene = new Scene(); // instantiate Scene Object
    var renderer: Renderer;
    var camera: PerspectiveCamera;
    var stats: Stats;
    var spotLight: SpotLight;
    var ambientLight: AmbientLight;
    var pointLight: PointLight;
    
    // Game objects
    var groundGeometry: CubeGeometry;
    var groundMaterial: Physijs.Material;
    var ground: Physijs.Mesh;
    var clock: Clock;
    var playerGeometry: CubeGeometry;
    var playerMaterial: Physijs.Material;
    var player: Physijs.Mesh;
    var sphereGeometry: SphereGeometry;
    var sphereMaterial: Physijs.Material;
    var sphere: Physijs.Mesh;
    var keyboardControls: objects.KeyboardControls;
    var mouseControls: objects.MouseControls;
    var assets: createjs.LoadQueue;
    
    // Custom game objects
    var collectibleBallGeometry: SphereGeometry;
    var collectibleBallMaterial: Physijs.Material;
    var collectibleBall: Physijs.Mesh;
    var isGrounded: boolean;
    var velocity: Vector3 = new Vector3(0, 0, 0);
    var prevTime: number = 0;
    var health = 100;
    var score = 0;
    var boulders: Physijs.Mesh[] = [];
    var numberOfBoulders = 10;
    var gameOver = false;
    var wall;
    var wall1;
    var wall2;
    var wall3;
    var wall4;
    // Message displayed to screen in index.html
    var screenMessage = document.getElementById("message");
    var messageWidth;
    
    // An array that contains our sounds
    var manifest = [
        {id: "land", src:"../../Assets/audio/land.wav"},
        {id: "jump", src:"../../Assets/audio/jump.wav"},
        {id: "yeah", src:"../../Assets/audio/yeah.mp3"},
        {id: "bling", src:"../../Assets/audio/bling.wav"},
        {id: "damage", src:"../../Assets/audio/damage.mp3"},
        {id: "yayChord", src:"../../Assets/audio/yaychord.wav"},
        {id: "gameover", src:"../../Assets/audio/gameover.mp3"},
        {id: "gamelost", src:"../../Assets/audio/gamelost.wav"}      
    ];
    
    // Preload sounds and store in LoadQueue
    function preload(): void{
        assets = new createjs.LoadQueue();
        assets.installPlugin(createjs.Sound);
        assets.on("complete", init); // run init (initialize scene) when preload complete
        assets.loadManifest(manifest); // load array
    }
    
    // Initialize scene
    function init(): void{
        
        // Scene changes for Physijs
        scene.name = "Main";
        scene.fog = new THREE.Fog(0xffffff, 0, 750);
        scene.setGravity(new THREE.Vector3(0, -10, 0));
        
        // Add event listener to scene
        scene.addEventListener('update', () => {
            scene.simulate(undefined, 2);
        });
        
        updatePlayerStats(); // display player stats (health/score) on initialization       
        collectibleBall = undefined; // ball is not in scene
        
        // Setup HTMLElements
        blocker = document.getElementById("blocker");
        instructions = document.getElementById("instructions");
        
        // Check to see if pointerlock is supported
        havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;
        
        // Add keyboard and mouse controls to scene
        keyboardControls = new objects.KeyboardControls();
        mouseControls = new objects.MouseControls();
        
        // Lock mouse pointer to browser window
        if (havePointerLock) {
            element = document.body;

            instructions.addEventListener('click', () => {

                // Ask the user for pointer lock
                console.log("Requesting PointerLock");

                element.requestPointerLock = element.requestPointerLock ||
                    element.mozRequestPointerLock ||
                    element.webkitRequestPointerLock;

                element.requestPointerLock();
            });

            document.addEventListener('pointerlockchange', pointerLockChange);
            document.addEventListener('mozpointerlockchange', pointerLockChange);
            document.addEventListener('webkitpointerlockchange', pointerLockChange);
            document.addEventListener('pointerlockerror', pointerLockError);
            document.addEventListener('mozpointerlockerror', pointerLockError);
            document.addEventListener('webkitpointerlockerror', pointerLockError);
        }
        
        // MAIN SCENE SETUP
        setupRenderer(); // setup the default renderer
        setupCamera(); // setup the camera

        // Spot Light
        spotLight = new SpotLight(0xffffff);
        spotLight.position.set(0, 150, 0);
        spotLight.castShadow = true;
        spotLight.intensity = 1;
        spotLight.lookAt(new Vector3(0, 0, 0));
        spotLight.shadowCameraNear = 2;
        spotLight.shadowCameraFar = 200;
        spotLight.shadowCameraLeft = -5;
        spotLight.shadowCameraRight = 5;
        spotLight.shadowCameraTop = 5;
        spotLight.shadowCameraBottom = -5;
        spotLight.shadowMapWidth = 2048;
        spotLight.shadowMapHeight = 2048;
        spotLight.shadowDarkness = 0.5;
        spotLight.name = "Spot Light";
        scene.add(spotLight);
        console.log("Added spotLight to scene");
        
        //Add point light
        pointLight = new PointLight(0xffffff, 1, 0);
        pointLight.position.set(0,50,0);
        pointLight.castShadow = true;
        scene.add(pointLight);

        // Ground
        groundGeometry = new BoxGeometry(50, 1, 50);
        var wallGeo = new BoxGeometry(50, 1, 15);
        groundMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xecf0f1 }), 0, 0);            
        ground = new Physijs.ConvexMesh(groundGeometry, groundMaterial, 0);
        ground.receiveShadow = true;
        ground.name = "Ground";
        scene.add(ground);
        console.log("Added Ground to scene");
        
        // Wall One
        wall = new Physijs.ConvexMesh(wallGeo, groundMaterial, 0);
        wall.receiveShadow = true;
        wall.name = "Wall1";
        wall.rotation.x = Math.PI / 2;;
        wall.position.set(0,7,-25);
        scene.add(wall);
        
        // Wall Two
        wall2 = new Physijs.ConvexMesh(wallGeo, groundMaterial, 0);
        wall2.receiveShadow = true;
        wall2.name = "Wall2";
        wall2.rotation.x = -Math.PI / 2;;
        wall2.position.set(0,7,25); 
        scene.add(wall2);
        
        // Wall Three
        wall3 = new Physijs.ConvexMesh(wallGeo, groundMaterial, 0);
        wall3.receiveShadow = true;
        wall3.name = "Wall3";
        wall3.rotation.x = -Math.PI / 2;;
        wall3.rotation.z = -Math.PI / 2;;
        wall3.position.set(25,7,0);
        scene.add(wall3);
        
        // Wall Four
        wall4 = new Physijs.ConvexMesh(wallGeo, groundMaterial, 0);
        wall4.receiveShadow = true;
        wall4.name = "Wall4";
        wall4.rotation.x = -Math.PI / 2;;
        wall4.rotation.z = -Math.PI / 2;;
        wall4.position.set(-25,7,0); 
        scene.add(wall4);
        console.log("Walls Added");
        
        // Spawn objects
        spawnCollecibleBall();
        spawnBoulders();
        
        // Player Object
        playerGeometry = new BoxGeometry(2, 2, 2);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);
        
        player = new Physijs.BoxMesh(playerGeometry, playerMaterial, 1);
        player.position.set(20, 5, 5);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        player.rotation.y = 1.5;
        scene.add(player);
        console.log("Added Player to Scene");
        
        // Player collision detection
        player.addEventListener('collision', (event) => {
            if (event.name === "Ground") {
                console.log("player hit the ground");
                isGrounded = true;
                createjs.Sound.play("land");
            }
            if (event.name === "Boulder") {
                health = health -= 1; // decrement health on hit
                
                // Check if the player is dead
                if(health <= 0){
                    health = 0;
                    createjs.Sound.play("gamelost");
                }
                
                updatePlayerStats();
                console.log("player hit the boulder");
                createjs.Sound.play("damage");
            }
            if (event.name == "CollectibleBall") {                
                score = score += 1; // increment score on hit
                
                // Check if the game has been won
                if(score < 10)
                    flashFeedback();
                else {
                    giveFeedback();
                    createjs.Sound.play("gameover");
                }
                
                scene.remove(collectibleBall);
                collectibleBall = undefined;
                updatePlayerStats();
                console.log("player hit the collectible ball");
                createjs.Sound.play("bling");
            }
        });
        
        // Add camera to player
        player.add(camera);
        camera.position.set(0, 1, 0);

        // Add framerate stats
        addStatsObject();
        console.log("Added Stats to scene...");

        document.body.appendChild(renderer.domElement);
        gameLoop(); // render the scene	
        scene.simulate(); // iterate physics setup

        window.addEventListener('resize', onWindowResize, false);
    } // end init
    
    // Helper method to switch scene object colors, play sound and display message on collecitble ball hit
    function flashFeedback(): void{           
        giveFeedback();
        setTimeout(function(){resetFeedback();}, 1000);
    }
    // Helper method to reset object colors and screen message back to original
    function resetFeedback(): void{
        
        displayMessage("");
        
        // Change wall colors
        wall.material = Physijs.createMaterial(new LambertMaterial({ color: 0xecf0f1 }), 0, 0);
        wall2.material = Physijs.createMaterial(new LambertMaterial({ color: 0xecf0f1 }), 0, 0);
        wall3.material = Physijs.createMaterial(new LambertMaterial({ color: 0xecf0f1 }), 0, 0);
        wall4.material = Physijs.createMaterial(new LambertMaterial({ color: 0xecf0f1 }), 0, 0);
        // Change ground color
        ground.material = Physijs.createMaterial(new LambertMaterial({ color: 0xecf0f1 }), 0, 0);
        // Change scene color
        renderer.setClearColor(0x404040, 1.0);
        
        // Change boulder colors
        for (var i = 0; i < numberOfBoulders; i++) {
            boulders[i].material = Physijs.createMaterial(new LambertMaterial({ color: 0x000000 }), 0.4, 0);
        }
    }
    // Helper method to change object colors, play sound and display message
    function giveFeedback(): void{
        // Play sounds
        createjs.Sound.play("yeah");
        createjs.Sound.play("yayChord");
        
        displayMessage(getRandomMessage()); // display message
        
        // Change wall colors
        wall.material = Physijs.createMaterial(new LambertMaterial({ color: 0xFF0080 }), 0, 0);
        wall2.material = Physijs.createMaterial(new LambertMaterial({ color: 0xFF0080 }), 0, 0);
        wall3.material = Physijs.createMaterial(new LambertMaterial({ color: 0xFF0080 }), 0, 0);
        wall4.material = Physijs.createMaterial(new LambertMaterial({ color: 0xFF0080 }), 0, 0);
        // Change ground color
        ground.material = Physijs.createMaterial(new LambertMaterial({ color: 0xccff00 }), 0, 0);
        // Change scene color
        renderer.setClearColor(0xBF5FFF, 1.0);
        
        // Change boulder colors
        for (var i = 0; i < numberOfBoulders; i++) {
                boulders[i].material = Physijs.createMaterial(new LambertMaterial({ color: getRandomColour() }), 0.4, 0);
        }
    }
    
    // Helper method returns 1 of three colours
    function getRandomColour(): number{
        
            var colourScheme = Math.floor(Math.random() * 3) + 1;
            
            switch (colourScheme) {
                case 1:
                    return new THREE.Color("#1E90FF").getHex();
                case 2:
                    return new THREE.Color("#FF0000").getHex();
                case 3:
                    return new THREE.Color("#32CD32").getHex();
                default:
                    return new THREE.Color("#000000").getHex(); // default color
            }        
    }
    
    // Helper 1 of 10 possible message combinations
    function getRandomMessage(): string{
            var message; // store message
            var emoji; // store emoji
            
            // Get random number from 1 to 3
            var randomMessage = Math.floor(Math.random() * 3) + 1;
            var randomEmoji = Math.floor(Math.random() * 3) + 1;
            
            // Return special message when half way to winning
            if (score != 5) {
            switch (randomMessage) {
                    case 1:
                        message = "wow! nice ";
                        break;
                    case 2:
                        message = "keep it up! ";
                        break;
                    case 3:
                        message = "you go ";
                        break;
                    default:
                        message = "default"; // default message
                        break;
                }
            
            switch (randomEmoji) {
                case 1:
                    emoji = "(づ｡◕‿‿◕｡)づ";
                    break;
                case 2:
                    emoji = "(☞ﾟ∀ﾟ)☞";
                    break;
                case 3:
                    emoji = "☜(˚▽˚)☞";
                    break;
                default:
                    emoji = "default"; // default emoji
                    break;
                }
                
                return message + emoji;
            }
            else {
                return "(ง°ل͜°)ง half way there"; // special characters are breaking visual studio code editor lol
            }
        }
    
    // PointerLockChange Event Handler
    function pointerLockChange(event): void {
        if (document.pointerLockElement === element) {
            // Enable our mouse and keyboard controls
            keyboardControls.enabled = true;
            mouseControls.enabled = true;
            blocker.style.display = 'none';
        } else {
            // Disable our mouse and keyboard controls
            keyboardControls.enabled = false;
            mouseControls.enabled = false;
            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';
            instructions.style.display = '';
            console.log("PointerLock disabled");
        }
    }

    // PointerLockError Event Handler
    function pointerLockError(event): void {
        instructions.style.display = '';
        console.log("PointerLock Error Detected!!");
    }

    // Window Resize Event Handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Add Frame Rate Stats to the Scene
    function addStatsObject(): void{
        stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);
    }        
    
    // Spawn boulders (do damage)
    function spawnBoulders(): void{
        for (var i = 0; i < numberOfBoulders; i++) {
            if (boulders[i] == undefined) { // if no boulder then add a boulder
               
                var xRand = getRandomSphereCoordinate();
                var zRand = getRandomSphereCoordinate();
                
                sphereGeometry = new SphereGeometry(1, 32, 32);
                sphereMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x000000 }), 0.4, 0);
                sphere = new Physijs.SphereMesh(sphereGeometry, sphereMaterial, 1);
                sphere.position.set(xRand, 5, zRand);
                sphere.receiveShadow = true;
                sphere.castShadow = true;
                sphere.name = "Boulder";
                boulders.push(sphere);
                scene.add(boulders[i]);
            }
        }
    };
    
    // Spawn the 'collectible' ball (scores points)
    function spawnCollecibleBall() {
        // Collectible Ball object
        if (collectibleBall == undefined) {
            var xRand = getRandomSphereCoordinate();
            var zRand = getRandomSphereCoordinate();
            
            collectibleBallGeometry = new SphereGeometry(0.5, 32, 32);
            collectibleBallMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xffff00 }), 0.4, 0);
            collectibleBall = new Physijs.SphereMesh(collectibleBallGeometry, collectibleBallMaterial, 1);
            collectibleBall.position.set(xRand, 2, zRand);
            collectibleBall.receiveShadow = true;
            collectibleBall.castShadow = true;
            collectibleBall.name = "CollectibleBall";
            scene.add(collectibleBall);
        }
    }
    
    // Check spawns helper method
    function checkSpawns() {
            spawnBoulders();
            spawnCollecibleBall();
    }
    
    // Get random coordinates helper method
    function getRandomSphereCoordinate() {
        var ret = 0; // Middle pls rename
        var intRand = getRandomInt(1,100);
        if (intRand > 50) {
            ret = 20;
        } else {
            ret = -20;
        }
        return ret;
    }    
    // Helper method that returns random number between min/max
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    // Updates the player statistics on index.html
    function updatePlayerStats(): void{
        var text2 = document.getElementById("playerStats");
        text2.style.color = "white"
        text2.style.fontSize = "20";
        text2.style.top = 50 + 'px';
        text2.style.left = 50 + 'px';
        text2.innerHTML = "Health: " + health + "<br>"
            + "Score: " + score;
    };
    
    // Function that checks scores and game over (contantly looped)
    function checkScores() {
        var btnString = "<br><br><br>Press 'R' + 'Y' to restart the game...";

        if (health <= 0) {
            // Player lost, show message and restart
            health = 0;
             displayMessage("You lost... :'( Try again!" + btnString);
            gameOver = true;
        } else if (score >= 10) {
            // Player won, show message and restart
            displayMessage("You win yeah! :)" + btnString);         
            gameOver = true;
            
        } else {
            gameOver = false;
        }
        // Restart game if button Y + R combination is pressed
        if (keyboardControls.restartP1 && keyboardControls.restartP2 && gameOver) {
            restartGame();
            keyboardControls.restartP1 = false;
            keyboardControls.restartP2 = false;
        }
    }
    
    // Displays given string to screen (using the "message" div/id in index.html)
    function displayMessage(message): void{
        screenMessage.style.color = "white"
        screenMessage.style.fontSize = "60px";
        messageWidth = (screenMessage.clientWidth / 2);
        screenMessage.style.display = "none";
        screenMessage.style.top = 200 + 'px';
        screenMessage.style.left = ((screen.width / 2) - messageWidth) + 'px';
        screenMessage.innerHTML = message;
        screenMessage.style.display = "block";
    }
    
    // Restart game
    function restartGame() {
        // Remove message and reset color
        displayMessage("");
        resetFeedback();
               
        // Reset score
        score = 0;
        health = 100;
        scene.remove(collectibleBall);
        for (var i = 0; i < numberOfBoulders; i++) {
            scene.remove(boulders[i]);
        }
        
        // Remove objects
        collectibleBall = undefined;
        boulders = [];
        
        // Spawn objects again
        spawnCollecibleBall();
        spawnBoulders();
        
        // Player Object
        player.position.set(20, 5, 5);
        player.rotation.y = 1.5;
        updatePlayerStats(); // update the scoreboard values
    }

    // Setup main game loop
    function gameLoop(): void {
        
        stats.update(); // update stats.js        
        checkControls(); // check for mouse/keyboard input
        checkSpawns();  // check if boulders/collectible balls need to be spawned  
        checkScores();  // check if health or score needs to be updated or if the game is over

        // Render using requestAnimationFrame
        requestAnimationFrame(gameLoop);

        // Render the scene
        renderer.render(scene, camera);
    }
    
    // Check controls
    function checkControls(): void {
        if (keyboardControls.enabled) {
            velocity = new Vector3();

            var time: number = performance.now();
            var delta: number = (time - prevTime) / 1000;
            var direction = new Vector3(0, 0, 0);
            
            // Check for input
            if (isGrounded) {                    
                if (keyboardControls.moveForward) {
                      velocity.z -= 600.0 * delta;
                }
                if (keyboardControls.moveBackward) {
                      velocity.z += 600.0 * delta;
                }
                if (keyboardControls.moveLeft) {
                    velocity.x -= 600.0 * delta;
                }
                if (keyboardControls.moveBackward) {
                    velocity.z += 600.0 * delta;
                }
                if (keyboardControls.moveRight) {
                    velocity.x += 600.0 * delta;
                }
                if (keyboardControls.jump) {
                    velocity.y += 4000.0 * delta;
                    if (player.position.y > 2) {
                        createjs.Sound.play("jump");
                        isGrounded = false;
                    }                     
                }

                player.setDamping(0.9, 0.1); // Reduce frition when moving on ground
                
                // Changing player's rotation
                player.setAngularVelocity(new Vector3(0, mouseControls.yaw, 0));
                direction.addVectors(direction, velocity);
                direction.applyQuaternion(player.quaternion);
                
                // Let the player move if it's current x velocity is under 20 and y velocity under 10 (units)
               if (Math.abs(player.getLinearVelocity().x) < 20 && Math.abs(player.getLinearVelocity().y) < 10) {
                    player.applyCentralForce(direction);
               }

                cameraLook(); // Point camera to mouse

            } // isGrounded ends
            
                 // Other objects movement
                var velocity2 = new Vector3();
                var direction2 = new Vector3();
                
                // Get random number between 0 and 100 to provide more *even* ball movement
                // 0 - 24 = apply force to ball positively along x axis
                // 25 - 49 = apply force to ball negatively along x axis
                // 50 - 74 = apply force to ball positively along z axis
                // 75 - 100 = apply force to ball negatively along z axis
                var rand = getRandomInt(0,100);
                // Trying to get balls going back and forth
                    if (rand < 25) {
                        velocity2.x += 500 * delta;
                    } else if (rand > 25 && rand < 50) {
                        velocity2.x -= 500 * delta;
                    } else if (rand > 50 && rand < 75) {
                        velocity2.z += 500 * delta;
                    } else {
                        velocity2.z -= 500 * delta;
                    }
                    
                direction2.addVectors(direction2, velocity2);
                
                // If the collecitble ball is NOT undefined give it a rotation and apply force
                if (collectibleBall != undefined) {
                    direction2.applyQuaternion(collectibleBall.quaternion);
                    collectibleBall.applyCentralForce(direction2);
                }
                
                // How many boulders to spawn in the different corners 
                for (var i = 0; i < numberOfBoulders; i++) {
                    var velocity3 = new Vector3();
                    var direction3 = new Vector3();
                    var rand = getRandomInt(0,100);
                    if (rand < 25) {
                        velocity3.x += 500 * delta;
                    } else if (rand > 25 && rand < 50) {
                        velocity3.x -= 500 * delta;
                    } else if (rand > 50 && rand < 75) {
                        velocity3.z += 500 * delta;
                    } else {
                        velocity3.z -= 500 * delta;
                    }
                    
                    // If boulders are NOT undefined apply a rotation/speed/force
                    direction3.addVectors(direction3, velocity3);
                    if (boulders[i] != undefined) {
                        direction3.applyQuaternion(boulders[i].quaternion);
                        boulders[i].applyCentralForce(direction3);
                    }
                }

            // Reset Pitch and Yaw
            mouseControls.pitch = 0;
            mouseControls.yaw = 0;

            prevTime = time;
        } // controlsEnabled ends
        else {
            // Player doesn't move when it lands
            player.setAngularVelocity(new Vector3(0, 0, 0));
        }
    } // checkControls ends
    
    // Function for camera to track mouse
    function cameraLook(): void {
        var zenith: number = THREE.Math.degToRad(10);
        var nadir: number = THREE.Math.degToRad(-10);

        var cameraPitch: number = camera.rotation.x + mouseControls.pitch;

        // Constrain the camera pitch
        camera.rotation.x = THREE.Math.clamp(cameraPitch, nadir, zenith);
    }

    // Setup default renderer
    function setupRenderer(): void {
        renderer = new Renderer({ antialias: true });
        renderer.setClearColor(0x404040, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(CScreen.WIDTH, CScreen.HEIGHT);
        renderer.shadowMap.enabled = true;
        console.log("Finished setting up Renderer...");
    }

    // Setup main camera for the scene
    function setupCamera(): void {
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 100);
        console.log("Finished setting up Camera...");
    }

    window.onload = preload;

    return {
        scene: scene
    }

})();
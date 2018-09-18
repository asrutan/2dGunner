//
// funnerGunner.js
// Alexander Rutan
//

//simple game with a single moving ball
var scene;
var player;
var camera;
var bullet = [];
var enemy = [];
var maxBullets = 10;
var currentBullets = 0;
var fired = false; //check if fired this frame.

var rotateSpeed = 1;
var playerSpeed = 0;
var bulletSpeed = 5;

function Bullet(positionX, positionY, angle, velocity, friendly){
	this.sprite = new Sprite(scene,"redBall.png",20,20)
	this.sprite.setBoundAction(DIE);
	this.sprite.setPosition(positionX, positionY);
	this.sprite.setMoveAngle(angle);
	this.sprite.setSpeed(velocity);
	this.friendly = friendly;
	this.dead = false;
	
	this.update = function(){
		this.sprite.update();
		if(this.sprite.visible == false){
			this.dead = true;
		}
	}
}

function Player (){
	this.x = scene.width/2;
	this.y = scene.height/2;
}

function Enemy (positionX, positionY){
	this.sprite = new Sprite(scene, "redBall.png", 80, 80);
	this.sprite.setBoundAction(CONTINUE);
	this.sprite.setPosition(positionX,positionY); //put player in middle of screen
    this.sprite.setMoveAngle(180);
	this.sprite.setSpeed(0);
	
	this.update = function(){
		this.sprite.update();
	}
}	
function FreeCamera(){
	this.x = 0;
	this.y = 0;
	
	this.update = function(){
		
	}
}
  
function init(){
	scene = new Scene();
	player = new Sprite(scene, "redBall.png", 50, 50);
	player.setBoundAction(CONTINUE);
	player.setPosition(0,0); //put player in middle of screen
    player.setMoveAngle(180);
	player.setSpeed(playerSpeed);
	
	enemy.push(new Enemy(400, 500));
	
	//Free cam for debugging. Send player as paramater normally.
	//camParent = new FreeCamera();
	//camera = new FreeCamera(scene, camParent);

	camera = new Camera(scene, player, scene.width/2, scene.height/2);
	scene.start();
} // end init

function fire(){
	if(currentBullets < maxBullets){		
		bullet.push(new Bullet(player.x, player.y, player.getMoveAngle(), bulletSpeed, true));
		console.log(bullet); //debug
		currentBullets++;
	}
}

function input(){
	//Space bar for fire
	if(keysDown[K_SPACE] == true && fired == false){
		fired = true;
		fire();
	}
	if(keysDown[K_SPACE] == false && fired == true){
		fired = false;
	}
	
	//Left and Right keys for rotating
	if(keysDown[K_LEFT] == true){
		player.turnBy(rotateSpeed * -1);
	}
	if(keysDown[K_RIGHT] == true){
		player.turnBy(rotateSpeed);
	}
	
	/*
	//Move FreeCam with WASD
	if(keysDown[K_W] == true){
		camParent.y = camParent.y - 1;
	}
	if(keysDown[K_S] == true){
		camParent.y = camParent.y + 1;
	}
	if(keysDown[K_A] == true){
		camParent.x = camParent.x - 1;
	}
	if(keysDown[K_D] == true){
		camParent.x = camParent.x + 1;
	}
	*/
	
	
		//Move player with WASD
	if(keysDown[K_W] == true){
		player.y = player.y - 2;
	}
	if(keysDown[K_S] == true){
		player.y = player.y + 2;
	}
	if(keysDown[K_A] == true){
		player.x = player.x - 2;
	}
	if(keysDown[K_D] == true){
		player.x = player.x + 2;
	}
	
}

	
function update(){
	input();
    scene.clear();
	camera.update();
    player.update();
	for(i = 0; i < enemy.length; i++){
		enemy[i].update();
	}
	for(i = 0; i < bullet.length; i++){
		//remove from array if it has "died".
		if(bullet[i].dead == true){
			bullet.splice(i, 1);
			currentBullets--;
		}
		else{
			bullet[i].update();
			console.log(bullet[i].friendly);
		}

	}
} // end update
//
// funnerGunner.js
// Alexander Rutan
//

//simple game with a single moving ball
var firstRun = true;
var gameOver = false;

var scene;
var player;
var camera;
var hud;
var bullet = [];
var enemy = [];
var maxBullets = 10;
var currentBullets = 0;
var fired = false; //check if fired this frame.

var rotateSpeed = 1;
var playerSpeed = 3;
var bulletSpeed = 5;

function AiController(player){
	this.target = player;
	
	this.update = function(){
		for(i = 0; i < enemy.length; i++){
			if(enemy[i].aggro == true){
				enemy[i].chase(this.target);
			}
		}
	}
}

function Bullet(positionX, positionY, angle, velocity, friendly){
	this.sprite = new Sprite(scene,"redBall.png",20,20)
	this.sprite.setBoundAction(DIE);
	this.sprite.setPosition(positionX, positionY);
	this.sprite.setMoveAngle(angle);
	this.sprite.setSpeed(velocity);
	this.friendly = friendly; //set false for bullets not fired by player.
	this.damage = 1;
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
	this.hitPoints = 5;
	this.damageAggroThreshold = 1;
	this.speed = -1;
	this.speedModifier = 0;
	this.dead = false;
	this.aggro = true;
	this.knockedBack = false; this.knockedBackXenith = false;
	this.knockBackForce = 0;
	
	this.sprite = new Sprite(scene, "redBall.png", 80, 80);
	this.sprite.setBoundAction(CONTINUE);
	this.sprite.setPosition(positionX,positionY); //put player in middle of screen
    this.sprite.setMoveAngle(180);
	this.sprite.setSpeed(0);
	if(this.aggro == true){
		this.sprite.setSpeed(this.speed);
	}
	
	this.update = function(){
		if(this.knockedBack == true){
			this.performKnockBack();
			this.sprite.setSpeed(this.speed + this.speedModifier);
		}
		this.sprite.update();
		if(this.hitPoints <= 0){
			this.dead = true;
		}
		scene.sSetText(this.hitPoints, this.sprite.x - scene.camera.x, this.sprite.y - scene.camera.y, DEFAULT);
	}
	
	this.damageBy = function(amount){
		this.hitPoints -= amount;
		if(this.aggro == false){		
			if(amount >= this.damageAggroThreshold){
				this.setAggro(true)
			}
		}
		
		this.knockBack(20);
	}
	
	this.knockBack = function(force){
		this.knockedBack = true;
		this.knockedBackXenith = false;
		this.knockBackForce = force;
	}
	
	this.performKnockBack = function(){
		if(this.knockedBack == true && this.knockedBackXenith == false){
			this.speedModifier += this.knockBackForce / 2;	
			if(this.speedModifier >= this.knockBackForce){
					this.knockedBackXenith = true;
				}
			}
		else if(this.knockedBack == true){
			this.speedModifier--;
			if(this.speedModifier <= 0){
				this.knockedBack = false;
				this.knockBackForce = 0;
				this.sprite.setSpeed(this.speed);
				}
			}
		}
	
	this.setAggro = function(bool){
		this.aggro = bool;
		if(this.aggro == false){
			this.sprite.setSpeed(0);
		}
		else{
			this.sprite.setSpeed(this.speed);
		}
	}
	
	this.chase = function(player){
		this.sprite.setAngle(this.sprite.angleTo(player));
	}
}	

function FreeCamera(){
	this.x = 0;
	this.y = 0;
	
	this.update = function(){
		
	}
}

function HUD(player, scene){
	this.scene = scene;
	this.player = player;
	
	this.update = function(){
		scene.sSetText(this.player.hitPoints, DEFAULT);
		//scene.drawText();
	}
}
  
function init(){
	gameOver = false;
	console.log("Creating new game...");
	if(firstRun == true){
		scene = new Scene();
	}
	
	scene.clearText();
	
	player = new Sprite(scene, "redBall.png", 50, 50);
	player.setBoundAction(CONTINUE);
	player.setPosition(1,1); //put player in middle of screen
	player.setMoveAngle(180);
	player.setSpeed(0);
		
	enemy = [];
	enemy.push(new Enemy(400, 500));
	enemy.push(new Enemy(100, 200));
	enemy[1].setAggro(false);
		
	//Free cam for debugging. Send player as paramater normally.
	//camParent = new FreeCamera();
	//camera = new FreeCamera(scene, camParent);

	camera = new Camera(scene, player, scene.width/2, scene.height/2);
	hud = new HUD(enemy[0], scene);
	
	aiController = new AiController(player);
	
	if(firstRun == true){
		scene.start();
	}

} // end init

function reset(){
	firstRun = false;
	init();
}

function setGameOver(win){
	gameOver = true;
	
	scene.sSetText("Game Over.\nPress Fire To Restart.", 100, 400, GAMEOVER);
}

function fire(){
	if(gameOver == false){
		if(currentBullets < maxBullets){		
			bullet.push(new Bullet(player.x, player.y, player.getMoveAngle(), bulletSpeed, true));
			//console.log(bullet); //debug
			currentBullets++;
		}
	}
	else{
		reset();
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
	
	this.oldPlayerX = player.x;
	this.oldPlayerY = player.y;
	
		//Move player with WASD
	if(keysDown[K_W] == true){
		player.y = player.y - playerSpeed;
	}
	if(keysDown[K_S] == true){
		player.y = player.y + playerSpeed;
	}
	if(keysDown[K_A] == true){
		player.x = player.x - playerSpeed;
	}
	if(keysDown[K_D] == true){
		player.x = player.x + playerSpeed;
	}
	
	if(player.x <= 0){
		player.x = this.oldPlayerX;
	}
	if(player.y <= 0){
		player.y = this.oldPlayerY;
	}
}

	
function update(){
	input();
	aiController.update();
    scene.clear();
	if(gameOver == false){		
		camera.update();
		player.update();
		for(i = 0; i < enemy.length; i++){
			if(enemy[i].dead == true){
				enemy.splice(i, 1);
				if(enemy.length == 0){
					setGameOver(true);
				}
			}
			else{
				enemy[i].update();
			}
		}
		for(i = 0; i < bullet.length; i++){
			//remove from array if it has "died".
			if(bullet[i].dead == true){
				bullet.splice(i, 1);
				currentBullets--;
			}
			else{
				bullet[i].update();
				for(j = 0; j < enemy.length; j++){
					if(bullet[i].sprite.collidesWith(enemy[j].sprite) == true){
						bullet[i].dead = true;
						enemy[j].damageBy(bullet[i].damage);
						console.log("hit!");
						scene.sSetText("hit!", 10, 70, DEFAULT);
					}
				}
			}
		}
	}
	hud.update();
	scene.drawText();
} // end update
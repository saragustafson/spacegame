var starsX = []
var starsY = []
var ship;
var shipImage;
var lasers;
var laserImage;
var ws;
var players = []
var enemyLasers;
var uid;
var dead;
var button;
var client;


function controls(){
  if(keyDown(LEFT_ARROW) || keyDown('a')){
    ship.rotation -= 4
    send({
      mode: 'turn',
      angle: -4
    })
  }
  if(keyDown(RIGHT_ARROW) || keyDown('d')){
    ship.rotation += 4 
    send({
      mode: 'turn',
      angle: 4
    })
  }
  if(keyDown(UP_ARROW) || keyDown('w')){
    ship.addSpeed(0.2, ship.rotation - 90)
    send({
      mode: 'fly',
    })
  }
  if(keyWentDown(32)){ // 32 is for spacebar
    var x = ship.position.x
    var y = ship.position.y
    var r = ship.rotation
    fireLaser(x,y,r,lasers)
    send({
      mode: 'fire',
      x: x,
      y: y,
      r:r
    })
  }
}

function setup() {
  uid = randomString()

  createCanvas(884, 596)
  background(0)

  stroke(255)
  for(var i=0; i<1000; i++) {
    starsX[i] = random(width)
    starsY[i] = random(height)
  }

  shipImage = loadImage(pic)
  laserImage = loadImage(bullet)

  lasers = new Group()
  enemyLasers = new Group()

  ship = makeShip(random(width), random(height))
  
  var mqttURL = 'wss://mqtt.flespi.io'
  client = mqtt.connect(mqttURL, { username:'EUe0TKFgK4sGfhRWYGmZKebdPqXxfjiI4lyLT1QuV80YfHK3bWRKZQNC6AZaJ8IB'
  })
  client.on('connect', ()=>{
    initialMsg()
    client.subscribe('messages')
    client.on('message', function(t,b){
      try { 
        var hi = new TextDecoder("utf-8").decode(b)
        var yo = JSON.parse(hi)
        doStuff(yo)
      } catch(e){}
    })
  })
  
  button = createButton('respawn');
  button.position(19, 19);
  button.mousePressed(function(){
    if(!dead) return
    ship = makeShip(random(width), random(height))
    initialMsg()
    dead = false
    button.hide()
  });
  button.hide()

} // end setup function


function draw() {
  background(0)
  for(var i=0; i<1000; i++){
    point(starsX[i], starsY[i])
  }
  
  if(controls) controls()


  for(var i=0; i<allSprites.length; i++){
    var sprite = allSprites[i]
    if(sprite.position.x<0){sprite.position.x=width}
    if(sprite.position.x>width){sprite.position.x=0}
    if(sprite.position.y<0){sprite.position.y=height}
    if(sprite.position.y>height){sprite.position.y=0}
  }
  
  ship.overlap(enemyLasers, shipHit)

  drawSprites()
} // end draw function


function shipHit(){
  ship.changeAnimation('boom')
  ship.life = 20
  send({
    mode: 'boom',
    id: uid
  })
  dead = true
  button.show()
  // window.setTimeout(function(){ noLoop() }, 800)
}


function makeShip(x,y){
  var s = createSprite(x,y)
  s.maxSpeed = 5
  s.friction = 0.05
  s.setCollider('circle', 0, 0, 10)
  s.addImage(shipImage)
  s.addAnimation('boom',boomer)
  s.scale = 1
  return s
}


function fireLaser(x,y,r,group){
  if(dead) return
  var laz = createSprite(x,y)
  laz.addImage(laserImage)
  laz.setSpeed(12, r - 90)
  laz.rotation = r
  laz.scale = 0.5
  laz.life = 30
  group.add(laz)
}


window.addEventListener("keydown",function(e){
  e.preventDefault()
})


// Websocket stuff

function initialMsg() {
  send({
    mode: 'join',
    x: ship.position.x,
    y: ship.position.y
  })
}

function send(m) {
  if(m && client){
    m.id = uid
  	client.publish("messages",JSON.stringify(m))
  }
}

function doStuff(m){
  if(m.id == uid) return // not for myself
    
  if(m.mode=='join'){
    players[m.id] = makeShip(m.x, m.y)
    send({
      mode: 'here',
      x: ship.position.x,
      y: ship.position.y,
      r: ship.rotation
    })
  }

  if(m.mode=='here'){
    if(!players[m.id]){
      players[m.id] = makeShip(m.x,m.y)
      players[m.id].rotation = m.r
    }
  }

  if(m.mode=='turn'){
    players[m.id].rotation += m.angle
  }

  if(m.mode=='fly'){
    players[m.id].addSpeed(0.2, players[m.id].rotation - 90) 
  }

  if(m.mode=='fire'){
    fireLaser(m.x, m.y, m.r, enemyLasers)
    players[m.id].position.x = m.x
    players[m.id].position.y = m.y
    players[m.id].rotation = m.r
  }
  
  if(m.mode=='boom'){
    players[m.id].changeAnimation('boom')
    players[m.id].life = 20
  }

} // end doStuff



function randomString(){
  return Math.random().toString(36).substring(2, 15)
}

var pic = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAFmElEQVRYR82Xe2yNZxjAf9/pXS+qqqW3Ux9VrWujGN2QEUxbDJNhUyPMLSZmWzTS1WJsymgsy1Rss01Y5jLLYgQd5tZGqalStHW0VFtKTw9tT0/Pu5yvPZ+eVluJ0b05f73f8z7P7zzv+9wk/gdLem4GrSzQ5T2Xnuc6rPyBNofQykLcvI4UHMLzeOOZPCFAIASSJNnKa2VhzruIRu7XBEII5QASll/Lq1UBy3H3WXPEh8GBJCYmPpFXvJCLqVaPvZ0TUnC4DUhiYqLYcLOAih+2tWqjVYGWIEpC23HiYSXDPF3wyXncdhBWR7cZRMqCWUQf24MDAp8rhrbxxOapMUy6dIzL+ipG3za1DcS6QWFM1xeQXdGGEOu1HkxyruWGobrtPJEc1oUwfSk9XB0Jvvayo6M+Ryzt153kf3LZ0i+Iueez0Mj91XfxYvNEXa1AiAokyR2KBfhKWBKkTpdJ8PDJCshLgfgoIZ6kz9aoEDPHj2P7/r1q5nzhEJZ0fTrjDFGRQ1WI1RPHEL97F5puA/5jT1hcD6z11lBbVclKg5OSIL9atpjoSZMJDdSqEGumv8mKHb8iBfdQZFa0r6W2qpp11e3qkmoLPcfTa0e9cXNeJsJcwdaUvcyePxcHjRNZ6UeIf28+X3R2plfqZRViXa8AYh49wmHvHrpHDKOyxsi+ffuJ6BVGz/AQNF37NAvTLITIywSN5bOJBZ38mNtXJr3MQGQHV1LSrxM/JJSuR7JUiKRegYwsuUd5oA/eHdwRtSaO3rnP0pwS5Y9YVsPoaVjcm0LUh58+JoJqMxTr7mLs7IVZQJa+kt4eLvx49horh4Xhe+iSCrG+TyDDbhej6R+C2dJKWIxKcNa/O+JiJldKHvB10R2k4Ka9x1MhHswbS8WJk4qSGqOJsnpsoxA42tmRn5XP6IUz8EhIUSE29A1CLiymc99uZOsrMZrNDPJypU/sG9w9eJgdBfeJC/DCL+dRk/fRpFOyvPzCmaP4Ji2bABcHJvp7UZJ+FVMfmevnbzDdM0BB+sDbgeSMHBViXnAnUoS78m1EkY6kqFC+L6smoIsv7wgDq3OKmN+1E9cGD+ftnYdsQCSlUa1fF6YM4ZfUCywfN5Df/zxOtG97zEgUnbvKIy8PXqtyqzuslUVxhDd2RiPeBzJZHe5PpKcrY62VVCuLhPLbjJv9Fn+knmGerysOGonfih4SdyKVnFUJROw+oz4LReHD+WPVjQ0bt7Ns8QyOH0hlkKcr9hqJ/LQrDHbzf0KvlcWtnm7Kde0uNRDRzpGebk74ZlfYyBiXTGD91p28q/VBI0mk5BSxKOMUjls2qvY8vz2ICnHo6i0KHlaQf+hvRk2L5Xp6BtMCvHCx0+B9WW+jvGJRDA+OHuNoqZ4ov4641NRYelqMj43IOqON7CYPI1P8O2InQdJFHfLHy6n66zCBnu6M6RlEHYR1dqhnk3R5lH2+EOPJ0+y584Dx/h0IaARx1E9DFdDZyRE/t3YIU42i6EBxOXPKNDYQxaPDEYUFylUMffyY70oNbPLo8iRCdXmNWvh6oKQli+i/K5lQL08Md+4TrndS30JGN2c6OdgrSiyGdxaWUW02ExfkreyV1pgYkFulypfHvU55Wjr2ZhM/Rb/PJxuTW4kOK59WFlMHR4KzC0mF59DmVqpK1/o6EfnlJrSfLsbZxQVnjYZyUy1udhI/V9ozcNVaRsQtUOXvxfZnfHY5Wl8fdp5Oe2r6br7l18rC9V4xaYMC6Z1ne89W1jPbNhPyyqvkFxYycEysjYut12wYGUJ0bhXHbxY0Wz9anju0suhSUkiRT0BTBQ1CW7XeuEhpZXGqhztR1xpETcN8bX2HT9mz3bIaa2RATEDNL9YD0v5GI18zZxvbbH0Ca2bqrhFNIRyU0bPReoap/V+BRQoPfqVJBwAAAABJRU5ErkJggg=="

var bullet = 'data:image/png;base64,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'

var boomer= 
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAActpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgSW1hZ2VSZWFkeTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KKS7NPQAAAe1JREFUWAntlT9KA0EUxkejiI0IafUAwRSWVmKdO9jZSPQCHiAXUPEA3sHa0tJC8QAWVgFJIxJi9Iv8dt8OMzuzEGzcgWVm3rw33/f+zTr338dKbgAO9rrzfnezUH8afxRrf/HwPM6+N6logYePEx/LXe9vuRCZXBK1BE4Od+YghsA5O91dZ+mIkkjlkFgtLL2FPLee9S6+Fhr9t47Tpz3fzeu0sK4jWiiZRZSA0XFcKmBG57z0WjKRgAj6cgL92JxFIGbsy4mI5EqFPptGX1/7tZBQMuUPD1Row9HE9VwZaum8jEr+pEhyhk0hMn+OEkBRl9wffzo3qAJyTlpml781glxpsMWJ3J9LF7wT2o+86jjkpWdW2cqWrqgcmE2UgNGpLOkCCZWa2eV08VkliOo8NZIEUpec3W1XakGAqg3sUnWQrIGrwXvFCXlM8dFuUji63SjaUHsBp8IvvSgBdUH/5yUUmEIKqIwIMbJYsYlE6jWsTQHhA0jgdkCERyhGxNr469p/AcrqCLoBELWmJYYcG80p76VTGwEpMCgq9so5A3BeP8ntQ4ZeaM6KgAx5F0LFRaoAyPEc3WwCkMCQCge8CSh3aG5EQAb8H7Rm2HA3JRJtQy7356YAvv1S96FoLBWgvayNQBuBNgJ/EYFvK9nN0Flp4PUAAAAASUVORK5CYII='

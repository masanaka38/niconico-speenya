/* global chrome, io */
(function () {
  // change to your server url
  const SERVER_URL = 'https://niconico.bikatsubu.jp:2525'
  //const SERVER_URL = 'http://localhost:2525'
  const APP_ID = chrome.runtime.id
  const APP_VERSION = chrome.runtime.getManifest().version
  let idx = 0;
  let heartBeat = [{}];

  let socket = null

  function connect () {
    if (socket) return

    socket = io.connect(SERVER_URL, { 'forceNew': true })
    socket.on('comment', handleComment)
    socket.on('heart_beat', handleHeartBeat);
    socket.on('like', handleLike)

    chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
      //console.log(request);
      idx = request.idx; 
    });

    var img = document.getElementById('_bb_meter')
    if(img === null) {
      var w = window.innerHeight / 800 *84 
      img = document.createElement('img');
      img.id = '_bb_meter';
      img.style.position = 'fixed'
      img.src = `chrome-extension://${APP_ID}/images/meter.png`;
      img.style.top  = '8px'
      img.style.left = (window.innerWidth - w) + 'px'
      img.style.height = (window.innerHeight - 16) + 'px'
      img.style.zIndex = 2147483640
      document.body.appendChild(img);
    }

    console.log(`niconico speenya v${APP_VERSION}: connect to ${SERVER_URL}`)
  }

  function disconnect () {
    if (!socket) return

    socket.disconnect()
    socket = null

    console.log(`niconico speenya v${APP_VERSION}: disconnect from ${SERVER_URL}`)
  }

  function rand (value) {
    return Math.floor(value * Math.random())
  }

  function checkEnabled () {
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage({
        message: 'checkEnabled'
      }, function (response) {
        resolve(response)
      })
    })
  }

  function handleComment (msg) {
    const color = msg.color || '#000000'
    const shadow = msg.shadow || '#ffffff'
    const size = msg.size || 56

    const t = document.createElement('div')

    t.style.position = 'fixed'
    t.style.left = window.innerWidth + 'px'
    t.style.top = rand(window.innerHeight - 40) + 'px'
    t.style.fontSize = size + 'pt'
    t.style.fontWeight = 'bold'
    t.style.color = color
    t.style.textShadow = `-2px -2px 0px ${shadow}, -2px 2px 0px ${shadow}, 2px -2px 0px ${shadow}, 2px 2px 0px ${shadow}`
    t.style.whiteSpace = 'pre'
    t.style.zIndex = 2147483647

    t.innerText = msg.body

    document.body.appendChild(t)

    const effect = [{
      left: window.innerWidth + 'px'
    }, {
      left: -t.offsetWidth + 'px'
    }]

    const timing = {}
    timing.duration = (msg.duration || 2000) * (window.innerWidth + t.offsetWidth) / window.innerWidth
    timing.iterations = 1
    timing.easing = msg.easing || 'linear'

    t.style.top = rand(window.innerHeight - t.offsetHeight) + 'px'

    t.animate(effect, timing).onfinish = function () {
      document.body.removeChild(t)
    }
  }

  function handleHeartBeat(msg) {
    console.log(msg);
    
    if(msg.idx>0 ) {
      heartBeat[msg.idx-1] = {
        idx: msg.idx,
        name: msg.name,
        hb: msg.hb
      }
//      console.log(sortRanking(heartBeat));
    }

    rk = sortRanking(heartBeat)
    for(i=0; i<rk.length; i++) {
      const a = rk[i];
      hb_number(a.name, a.hb, i);
    }
    if(msg.idx == idx) {
      hb_heart(msg.hb);
    }
  }

  function sortRanking(hb) {
    tmp = hb.concat();
    tmp.sort(compare);
    return tmp;
  }
  function compare(a,b) {
    if (parseInt(a.hb) < parseInt(b.hb)) {
      return 1;
    } else {
      return -1;
    }
  }

  function hb_number(name, hb, idx) {
    const shadow = '#ffffff'
    var t = document.getElementById('_bb_'+idx);
    if (t===null) {
      t = document.createElement('div'); 
      t.id = '_bb_'+idx;
      t.style.position = 'fixed'
      t.style.textShadow = `-2px -2px 0px ${shadow}, -2px 2px 0px ${shadow}, 2px -2px 0px ${shadow}, 2px 2px 0px ${shadow}`
      t.style.left = '16px'
      t.style.top = (8 + idx * 60) + 'px'
      t.style.fontSize = '40pt'
      t.style.zIndex = 2147483647
      document.body.appendChild(t);
    }
    t.innerText = (idx+1) + "位 "  + name + ":" + hb
  }

  function hb_heart(hb) {
    var img = document.getElementById('_bb_img')
    if(img === null) {
      var h = window.innerHeight / 405 * 64;
      img = document.createElement('img');
      img.id = '_bb_img';
      img.style.position = 'fixed'
      img.src = `chrome-extension://${APP_ID}/images/heart.png`;
      img.style.left = (window.innerWidth - h) + 'px'
      img.style.height = h + 'px'
      img.style.zIndex = 2147483647
      document.body.appendChild(img);
    }
    if(hb < 30) hb = 30
    if(hb > 200) hb = 200
    img.style.top = (1-hb/200) * window.innerHeight + 'px'
    return img;
  }

  function handleLike (msg) {
    const image = msg.image || 'thumb'
    const url = msg.url || `chrome-extension://${APP_ID}/images/${image}.png`

    const t = document.createElement('img')

    t.addEventListener('load', function (e) {
      t.style.position = 'fixed'
      t.style.left = rand(window.innerWidth) - t.width / 2 + 'px'
      t.style.top = rand(window.innerHeight) - t.height / 2 + 'px'
      t.style.zIndex = 2147483647 
      t.style.opacity = 0.0

      document.body.appendChild(t)

      const effect = [{
        opacity: 0.0,
        transform: 'scale(0.2, 0.2) translate(0, 20px)'
      }, {
        opacity: 1.0,
        transform: 'scale(0.5, 0.5) translate(0, 0px)'
      }, {
        opacity: 0.0,
        transform: 'scale(1.0, 1.0) translate(0, -50px)'
      }]

      const timing = {}
      timing.duration = msg.duration || 1000
      timing.iterations = 1
      timing.easing = msg.easing || 'ease'

      t.animate(effect, timing).onfinish = function () {
        document.body.removeChild(t)
      }
    })

    t.src = url
  }

  checkEnabled()
    .then(function (val) {

      if (val.enabled) {
        console.log(val.enabled, val.idx)
        idx = val.idx
        connect()
      } else {
        disconnect()
      }
    })

  return {
    connect: connect,
    disconnect: disconnect
  }

})()

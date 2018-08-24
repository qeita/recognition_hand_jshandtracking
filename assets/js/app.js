(() => {
  
  /**
   * WebRTCによるカメラアクセス
   */
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  
  let isVideoRun = true
  let isLoadedMetaData = false
  let constraints = { audio: false, video: {facingMode: 'user'} }


  function start(){
    isVideoRun = true
    navigator.mediaDevices.getUserMedia( constraints )
      .then( mediaStrmSuccess )
      .catch( mediaStrmFailed )
  }

  function mediaStrmSuccess( stream ){
    video.srcObject = stream

    // ウェブカムのサイズを取得し、canvasにも適用
    if(isLoadedMetaData) return
    isLoadedMetaData = true

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth  
      canvas.height = video.videoHeight

      requestAnimationFrame( draw )
    }, false)
  }

  function mediaStrmFailed( e ){
    console.log( e )
  }

  function stop(){
    isVideoRun = false
    let stream = video.srcObject
    let tracks = stream.getTracks()

    tracks.forEach( (track) => {
      track.stop()
    })
    video.srcObject = null
  }

  function draw(){
    if(!isVideoRun) return
    detectHand()
    requestAnimationFrame( draw )
  }

  start()


  /**
   * ストリームのコントロール
   */
  const stopBtn = document.getElementById('stop')
  const frontBtn = document.getElementById('front')
  const rearBtn = document.getElementById('rear')
  let isRun = false

  let ua = navigator.userAgent
  if(ua.indexOf('iPhone') < 0 && ua.indexOf('Android') < 0 && ua.indexOf('Mobile') < 0 && ua.indexOf('iPad') < 0){
    frontBtn.disabled = true
    rearBtn.disabled = true
  }

  stopBtn.addEventListener('click', () => {
    if(!isRun){
      stop()
      stopBtn.textContent = 'START'
    }else{
      start()
      stopBtn.textContent = 'STOP'
    }
    isRun = !isRun
  }, false)

  frontBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'user'
    setTimeout( () => {
      start()
    }, 500)
  }, false)

  rearBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'environment'
    setTimeout( () => {
      start()
    }, 500)
  }, false)


  /**
   * 手の認識
   */
  const cbxHullBtn = document.getElementById('cbxHull')
  const cbxDefectsBtn = document.getElementById('cbxDefects')
  let tracker = new HT.Tracker()

  function detectHand(){
    ctx.drawImage(video, 0, 0)
    if(video.readyState === video.HAVE_ENOUGH_DATA){
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let candidate = tracker.detect( imageData )

      if(candidate){
        if(cbxHullBtn.checked){
          drawHull(candidate.hull, 'red')
        }
        if(cbxDefectsBtn.checked){
          drawDefects(candidate.defects, 'blue')
        }
      }
    }
  }

  function drawHull(hull, color){
    let len = hull.length

    if(len > 0){
      ctx.beginPath()
      ctx.lineWidth = 3
      ctx.strokeStyle = color

      ctx.moveTo(hull[0].x, hull[0].y)
      for(let i = 1; i < len; ++i){
        ctx.lineTo(hull[i].x, hull[i].y)
      }

      ctx.stroke()
      ctx.closePath()
    }
  }

  function drawDefects(defects, color){
    let len = defects.length
    let point

    if(len > 0){
      ctx.beginPath()
      ctx.lineWidth = 3
      ctx.strokeStyle = color
      
      for(let i = 0; i < len; ++i){
        point = defects[i].depthPoint
        ctx.strokeRect(point.x - 4, point.y - 4, 8, 8)
      }
      ctx.stroke()
      ctx.closePath()
    }
  }


})()
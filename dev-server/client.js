;(function() {
  const socketurl = `ws://localhost${window.frondjs.port}`
  const socketconn = new WebSocket(socketurl)

  socketconn.addEventListener('open', function(event) {
    socketconn.send('Browser connection established.')
  })

  socketconn.addEventListener('message', function(e) {
    const msg = JSON.parse(e.data)
    if (msg.codebaseUpdated === true) window.location.reload()
    if (msg.updateCount) console.log('Codebase update: ' + msg.updateCount)
  })
})()

// import { join } from 'path'
// import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser';
const { json, urlencoded } = bodyParser;
// var lt = require ("localtunnel");
// var open = require ("open");

import express from 'express';
const app = express() as any;
// var server = require('http').createServer(app);
// var socketio = require('socket.io').listen(server);

import cors from 'cors';
// require("dotenv").config();

const port = process.env.PORT || 3300;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// if (process.env.USE_TUNNEL != 0) {
//   (async () => {
//     console.log("Getting tunnel...")
//     const tunnel = await lt({
//       port,
//       subdomain: "bom-codenames"
//     });

//     // the assigned public url for your tunnel
//     console.log("App on network: "+tunnel.url);
//     open(tunnel.url)

//     tunnel.on('close', () => {
//       // tunnels are closed
//       console.log(`Network tunnel to port ${port} was closed.`)
//     });
//   })();
// }

const corsOptions = {};

app.use(cors(corsOptions));
app.use(json());
app.use(urlencoded({ extended: false }));
// app.use(cookieParser())
// app.use(express.static(join(__dirname, 'dist')))

// ROOMS
import GameRoom from './lib/server/GameRoom';
import UniqueIdManager from './lib/services/UniqueIdManager';
const roomIds = new UniqueIdManager(5);
const rooms = new Map<string, GameRoom>(); //Map<roomId,GameRoom>
const roomDeleteDelay = 1000 * 60 * 5;

function createRoom() {
  const newRoom = new GameRoom(roomIds.getNew());
  rooms.set(newRoom.id, newRoom);

  setTimeout(() => checkRoomStatus(newRoom.id), roomDeleteDelay);
  return newRoom;
}

function checkRoomStatus(roomId, alreadyInactive = false) {
  const roomMatch = rooms.get(roomId);
  if (roomMatch) {
    console.log('Checking room ' + roomId + ' for inactivity...');
    console.log('Active users:', roomMatch.activeUsers.length);
    if (roomMatch.activeUsers.length === 0) {
      if (alreadyInactive) {
        console.log('Room is still inactive. Will delete.');
        return deleteRoom(roomId);
      } else {
        console.log('Room is inactive. Will check again...');
        setTimeout(() => checkRoomStatus(roomId, true), roomDeleteDelay);
      }
    } else {
      console.log('Room is still active.');
      setTimeout(() => checkRoomStatus(roomId, false), roomDeleteDelay);
    }
  }
}

function deleteRoom(roomId) {
  console.log('DELETING ', roomId);
  const roomMatch = rooms.get(roomId);
  if (roomMatch) {
    rooms.delete(roomMatch.id);
    console.log('Deleting room ' + roomMatch.id);
    return true;
  } else {
    console.log('Could not find room: ' + roomId);
    return false;
  }
}

// ROUTES
app.get('/api/rooms/:id', (req, res) => {
  if (req.params.id == 'all') return res.json(rooms.values());

  const roomMatch = rooms.get(req.params.id);

  if (roomMatch) {
    res.json({ ok: true, rid: roomMatch.id });
  } else res.json({ ok: false });
});

app.post('/api/room/new', (req, res) => {
  const newRoom = createRoom();
  console.log('Created new room: ' + newRoom.id);
  res.json({ ok: true, rid: newRoom.id, hostUser: newRoom.hostUser });
});

app.post('/api/room/:id/room-action/:action', async (req, res) => {
  const { id, action } = req.params;
  const { userId, data } = req.body;
  const roomMatch = rooms.get(id);
  if (roomMatch) {
    const actionRes = await roomMatch.doRoomAction(userId, action, data);
    return res.json({
      success: true,
      actionRes,
      room: roomMatch.getRoomSummary(),
      game: roomMatch.game,
    });
  }
  return res.status(404).json({ success: false });
});

app.post('/api/room/:id/game-action/:action', async (req, res) => {
  const { id, action } = req.params;
  const { userId, data } = req.body;
  const roomMatch = rooms.get(id);
  if (roomMatch) {
    const actionRes = await roomMatch.doGameAction(userId, action, data);
    return res.json({
      success: true,
      actionRes,
      room: roomMatch.getRoomSummary(),
      game: roomMatch.game,
    });
  }
  return res.status(404).json({ success: false });
});

// app.get('/api/canrejoin/:roomId/:socketId', (req, res) => {
//   const roomId = req.params.roomId;
//   const socketId = req.params.socketId;
//   let canReconnect = false;
//   console.log('Checking if can reconnect: ', socketId);

//   const roomMatch = rooms.get(roomId);

//   if (roomMatch) {
//     console.log('Found requested room ' + roomMatch.id);
//     canReconnect = roomMatch.canReconnect(socketId);
//     console.log('Can reconnect: ' + canReconnect);
//   }

//   res.json({ ok: canReconnect });
// });

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404))
// })

// error handler
app.use(function (err, req, res, next) {
  console.log('Error!');
  console.log(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

// SOCKETS
// socketio.on('connection', (socket) => {
//   console.log("New socket connected: "+socket.id)

//   socket.on('joinRoom', (roomId, userData, cb) => {
//     console.log("requesting room id: "+roomId)

//     let roomMatch = rooms.get(roomId)

//     if (roomMatch) {
//       console.log('Found requested room '+roomMatch.id)
//       roomMatch.addPlayer(socket, userData)
//       cb(userData);
//     }
//     else {
//       console.log("Could not find room: "+roomId)
//       socket.emit('err',"Could not find room: "+roomId)
//     }
//   })

//   socket.on('rejoinRoom', (roomId, socketId, cb) => {
//     let roomMatch = rooms.get(roomId)
//     let success = false;
//     if (roomMatch) {
//       console.log('Rejoining socket to '+roomMatch.id)
//       success = roomMatch.handleReturningPlayer(socket, socketId, cb)
//       console.log("Room accepts return: "+success);
//     }
//     if (!success) socket.emit('err',"Could not reconnect to room: "+roomId)
//   })

// })

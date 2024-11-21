import dotenv from 'dotenv';
dotenv.config();

import bodyParser from 'body-parser';
const { json, urlencoded } = bodyParser;
import GameRoom from './lib/server/GameRoom';
import UniqueIdManager from './lib/services/UniqueIdManager';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import express from 'express';
const app = express() as any;

import cors from 'cors';

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const corsOptions = {};

app.use(cors(corsOptions));
app.use(json());
app.use(urlencoded({ extended: false }));


// ROOMS
const roomIds = new UniqueIdManager(5);
const rooms = new Map<string, GameRoom>();
const roomDeleteDelay = 1000 * 60 * 60 * 12;

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
        console.log('Room is inactive. Will check again.');
        setTimeout(() => checkRoomStatus(roomId, true), roomDeleteDelay);
      }
    } else {
      console.log('Room is still active.');
      setTimeout(() => checkRoomStatus(roomId, false), roomDeleteDelay);
    }
  }
}

function deleteRoom(roomId) {
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

app.get('/api/room/:rid', (req, res) => {
  console.log('Requested room: ' + req.params.rid);
  const { rid } = req.params;
  const roomMatch = rooms.get(rid);
  if (roomMatch) {
    return res.json({
      success: true,
    });
  }
  return res.status(404).json({ success: false });
});

app.post('/api/room/new', (req, res) => {
  const newRoom = createRoom();
  console.log('Created new room: ' + newRoom.id);
  res.json({ ok: true, rid: newRoom.id, hostUser: newRoom.hostUser });
});


app.post('/api/room/:id/connect', async (req, res) => {
  const { id } = req.params;
  const { returningUserId } = req.body;
  const roomMatch = rooms.get(id);
  if (roomMatch) {
    const joinedUser = await roomMatch.joinUser(returningUserId);
    return res.json({
      success: true,
      user: joinedUser,
      room: roomMatch.getRoomSummary(),
      game: roomMatch.game.getSummary(),
    });
  }
  return res.status(404).json({ success: false });
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
      user: roomMatch.users.get(userId),
      room: roomMatch.getRoomSummary(),
      game: roomMatch.game.getSummary(),
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
      user: roomMatch.users.get(userId),
      room: roomMatch.getRoomSummary(),
      game: roomMatch.game.getSummary(),
    });
  }
  return res.status(404).json({ success: false });
});



// STATIC SITE
app.use(express.static('dist'));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist/index.html'));
});



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


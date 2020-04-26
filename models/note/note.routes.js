const NoteController = require('./note.controller')
const AuthController = require("../authorization/auth.js")
const FolderController = require('../folder/folder.controller')
const fs = require('fs')

exports.routesConfig = function (app) {
	app.post('/api/note/createNote', [
        AuthController.proofToken,
        FolderController.checkIfFolderExist,
        NoteController.createNote
    ]);

    app.post('/api/note/getNotes', [
        AuthController.proofToken,
        NoteController.getNotes
    ]);

    app.delete('/api/note/deleteNote', [
        AuthController.proofToken,
        NoteController.isOwner,
        NoteController.deleteNote,
        NoteController.deleteNoteGrid,
    ]);

    app.post('/api/note/getSharedNote', [
        AuthController.proofToken,
        NoteController.getNoteSharedLink,
    ]);

    app.patch('/api/folder/saveNote', [
        AuthController.proofToken,
        NoteController.isOwner,
        NoteController.saveNote,
    ]);
}
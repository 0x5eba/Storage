const NoteController = require('./note.controller')
const AuthController = require("../authorization/auth.js")
const FolderController = require('../folder/folder.controller')

exports.routesConfig = function (app) {
	app.post('/api/note/createNote', [
        AuthController.proofToken,
        FolderController.checkIfFolderExist,
        NoteController.createNote
    ]);

    app.post('/api/note/getNotes', [
        AuthController.proofToken,
        FolderController.checkIfPasswordRequired,
        NoteController.getNotes
    ]);

    app.delete('/api/note/deleteNote', [
        AuthController.proofToken,
        NoteController.isOwner,
        NoteController.deleteNote,
    ]);

    app.post('/api/note/getSharedNote', [
        AuthController.proofToken,
        NoteController.getNoteSharedLink,
    ]);

    app.patch('/api/note/saveNote', [
        AuthController.proofToken,
        NoteController.isOwner,
        NoteController.saveNote,
    ]);

    app.patch('/api/note/changeFolder', [
        AuthController.proofToken,
        NoteController.isOwner,
        FolderController.checkIfFolderExist,
        NoteController.changeFolder,
    ]);
}
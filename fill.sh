mongo mongodb://localhost:27017/storage <<EOF
db.File.drop();
db.Folder.drop();
db.Note.drop();

db.createCollection("File");
db.createCollection("Folder");
db.createCollection("Note");
EOF

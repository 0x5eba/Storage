mongo mongodb://localhost:27017/storage <<EOF
db.File.drop();
db.Folder.drop();

db.createCollection("File");
db.createCollection("Folder");
EOF

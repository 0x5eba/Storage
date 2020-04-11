mongo mongodb://localhost:27017/meetgitter <<EOF
db.Coupon.drop();

db.createCollection("Utente");

db.Utente.insert({
  email: "sbiollo@gmail.com",
  password: "ciao",
  nome: "Sebastien",
  cognome: "Biollo"
});
EOF

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.options("*", cors());

// Chemin vers le fichier db.json
const DB_PATH = path.join(__dirname, 'db.json');

// Fonction pour lire la base de données
function readDB() {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

// Fonction pour écrire dans la base de données
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ===== ROUTES ATHLETE =====

// POST info athlète (mise à jour)
app.post('/api/athlete/info', (req, res) => {
  try {
    const db = readDB();
    const { id, ...updateData } = req.body;
    
    const athleteIndex = db.athletes.findIndex(a => a.id === id);
    
    if (athleteIndex === -1) {
      return res.status(404).json({ error: 'Athlète non trouvé' });
    }
    
    // Mise à jour des informations
    db.athletes[athleteIndex] = { ...db.athletes[athleteIndex], ...updateData };
    writeDB(db);
    
    // Ajout log
    db.logs.push({
      date: new Date().toISOString(),
      action: 'Mise à jour info athlète',
      athleteId: id,
      data: updateData
    });
    writeDB(db);
    
    res.json({ success: true, message: 'Informations mises à jour', athlete: db.athletes[athleteIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST document athlète
app.post('/api/athlete/doc', (req, res) => {
  try {
    const db = readDB();
    const { id, type, filename } = req.body;
    
    if (!['certificatMedical', 'passport'].includes(type)) {
      return res.status(400).json({ error: 'Type de document invalide' });
    }
    
    const athleteIndex = db.athletes.findIndex(a => a.id === id);
    
    if (athleteIndex === -1) {
      return res.status(404).json({ error: 'Athlète non trouvé' });
    }
    
    // Mise à jour du document
    db.athletes[athleteIndex].docs[type] = filename;
    writeDB(db);
    
    // Ajout log
    db.logs.push({
      date: new Date().toISOString(),
      action: 'Document uploadé',
      athleteId: id,
      documentType: type,
      filename: filename
    });
    writeDB(db);
    
    res.json({ 
      success: true, 
      message: `Document ${type} uploadé avec succès`,
      athlete: db.athletes[athleteIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST remarque athlète
app.post('/api/athlete/remarque', (req, res) => {
  try {
    const db = readDB();
    const { id, observation } = req.body;
    
    const athleteIndex = db.athletes.findIndex(a => a.id === id);
    
    if (athleteIndex === -1) {
      return res.status(404).json({ error: 'Athlète non trouvé' });
    }
    
    // Mise à jour de l'observation
    db.athletes[athleteIndex].observation = observation;
    writeDB(db);
    
    // Ajout log
    db.logs.push({
      date: new Date().toISOString(),
      action: 'Remarque ajoutée',
      athleteId: id,
      observation: observation
    });
    writeDB(db);
    
    res.json({ 
      success: true, 
      message: 'Remarque ajoutée avec succès',
      athlete: db.athletes[athleteIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== ROUTES COMMISSAIRE =====

// GET info athlète
app.get('/api/commissaire/info/:id', (req, res) => {
  try {
    const db = readDB();
    const athlete = db.athletes.find(a => a.id === parseInt(req.params.id));
    
    if (!athlete) {
      return res.status(404).json({ error: 'Athlète non trouvé' });
    }
    
    res.json({ success: true, athlete });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET tous les athlètes
app.get('/api/commissaire/athletes', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, athletes: db.athletes });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET épreuves d'un athlète
app.get('/athletes/:id/epreuves', (req, res) => {
  try {
    const db = readDB();
    const athleteId = parseInt(req.params.id);

    const links = db.athleteEpreuves || [];
    const epreuves = db.epreuves || [];

    const epreuveIds = links
      .filter((item) => item.athleteId === athleteId)
      .map((item) => item.epreuveId);

    const result = epreuves.filter((epreuve) => epreuveIds.includes(epreuve.id));
    res.json({ success: true, epreuves: result });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET documents athlète
app.get('/api/commissaire/doc/:id', (req, res) => {
  try {
    const db = readDB();
    const athlete = db.athletes.find(a => a.id === parseInt(req.params.id));
    
    if (!athlete) {
      return res.status(404).json({ error: 'Athlète non trouvé' });
    }
    
    res.json({ 
      success: true, 
      documents: athlete.docs,
      athleteId: athlete.id,
      nom: `${athlete.prenom} ${athlete.nom}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST validation athlète
app.post('/api/commissaire/validation', (req, res) => {
  try {
    const db = readDB();
    const { id, valide, motif } = req.body;
    
    const athleteIndex = db.athletes.findIndex(a => a.id === id);
    
    if (athleteIndex === -1) {
      return res.status(404).json({ error: 'Athlète non trouvé' });
    }
    
    // Mise à jour de la validation
    db.athletes[athleteIndex].valide = valide;
    
    if (motif && !valide) {
      db.athletes[athleteIndex].observation = `REFUS: ${motif}`;
    }
    
    writeDB(db);
    
    // Ajout log
    db.logs.push({
      date: new Date().toISOString(),
      action: valide ? 'Validation athlète' : 'Refus validation',
      athleteId: id,
      valide: valide,
      motif: motif || null
    });
    writeDB(db);
    
    // Ajout message si refus
    if (!valide && motif) {
      db.messages.push({
        id: db.messages.length + 1,
        athleteId: id,
        date: new Date().toISOString(),
        message: `Validation refusée: ${motif}`,
        expediteur: 'Commissaire',
        lu: false
      });
      writeDB(db);
    }
    
    res.json({ 
      success: true, 
      message: valide ? 'Athlète validé' : 'Athlète refusé',
      athlete: db.athletes[athleteIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST message commissaire
app.post('/api/commissaire/message', (req, res) => {
  try {
    const db = readDB();
    const { id, message } = req.body;
    
    const athlete = db.athletes.find(a => a.id === id);
    
    if (!athlete) {
      return res.status(404).json({ error: 'Athlète non trouvé' });
    }
    
    // Ajout du message
    db.messages.push({
      id: db.messages.length + 1,
      athleteId: id,
      date: new Date().toISOString(),
      message: message,
      expediteur: 'Commissaire',
      lu: false
    });
    
    writeDB(db);
    
    // Ajout log
    db.logs.push({
      date: new Date().toISOString(),
      action: 'Message envoyé',
      athleteId: id,
      message: message
    });
    writeDB(db);
    
    res.json({ 
      success: true, 
      message: 'Message envoyé avec succès'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET messages pour un athlète
app.get('/api/commissaire/messages/:athleteId', (req, res) => {
  try {
    const db = readDB();
    const athleteId = parseInt(req.params.athleteId);
    
    const athleteMessages = db.messages.filter(m => m.athleteId === athleteId);
    
    res.json({ 
      success: true, 
      messages: athleteMessages,
      count: athleteMessages.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route test
app.get('/', (req, res) => {
  res.json({
    message: 'API Athlète/Commissaire',
    version: '1.0.0',
    endpoints: {
      athlete: {
        'POST /api/athlete/info': 'Mettre à jour les informations',
        'POST /api/athlete/doc': 'Uploader un document',
        'POST /api/athlete/remarque': 'Ajouter une remarque'
      },
      commissaire: {
        'GET /api/commissaire/info/:id': 'Obtenir info athlète',
        'GET /api/commissaire/athletes': 'Liste tous les athlètes',
        'GET /api/commissaire/doc/:id': 'Obtenir documents',
        'POST /api/commissaire/validation': 'Valider/refuser athlète',
        'POST /api/commissaire/message': 'Envoyer message',
        'GET /api/commissaire/messages/:athleteId': 'Obtenir messages'
      }
    }
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur API démarré sur http://localhost:${PORT}`);
  console.log(`📁 Base de données: ${DB_PATH}`);
});
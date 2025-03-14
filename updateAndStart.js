// updateAndStart.js
const { execSync } = require('child_process');

try {
  // Ajouter tous les fichiers
  console.log('Exécution de "git add ." ...');
  execSync('git add .', { stdio: 'inherit' });

  // Tenter de committer; en cas d'erreur (aucun changement), on l'ignore
  try {
    console.log('Exécution de "git commit" ...');
    execSync('git commit -m "Auto commit on bot start"', { stdio: 'inherit' });
  } catch (commitError) {
    console.log('Aucun changement à commiter.');
  }

  // Pousser les changements vers la branche main
  console.log('Exécution de "git push origin main" ...');
  execSync('git push origin main', { stdio: 'inherit' });
} catch (gitError) {
  console.error('Erreur lors de la mise à jour Git:', gitError);
  // Vous pouvez choisir de continuer même en cas d'erreur Git
}

try {
  // Déployer les commandes
  console.log('Exécution de "node deploy-commands.js" ...');
  execSync('node deploy-commands.js', { stdio: 'inherit' });
  // Démarrer le bot
  console.log('Exécution de "node index.js" ...');
  execSync('node index.js', { stdio: 'inherit' });
} catch (botError) {
  console.error('Erreur lors du démarrage du bot:', botError);
}

// updateAndStart.js
const { execSync } = require('child_process');

/**
 * Exécute une commande shell et affiche une description.
 * En cas d'erreur, elle lève l'exception pour le bloc try/catch.
 * @param {string} command La commande à exécuter
 * @param {string} description Description de l'opération
 */
function runCommand(command, description) {
  console.log(`Exécution de "${command}" (${description})...`);
  execSync(command, { stdio: 'inherit' });
}

try {
  // Récupérer les dernières modifications depuis le dépôt distant
  runCommand('git pull origin main', 'Mise à jour du dépôt');

  // Ajouter tous les fichiers modifiés
  runCommand('git add .', 'Ajout des fichiers');

  // Tenter de committer ; si aucun changement, on l'ignore
  try {
    runCommand('git commit -m "Auto commit on bot start"', 'Commit automatique');
  } catch (commitError) {
    console.log('Aucun changement à commiter.');
  }

  // Pousser les changements vers la branche main
  runCommand('git push origin main', 'Pousser vers le dépôt distant');
} catch (gitError) {
  console.error('Erreur lors de la mise à jour Git:', gitError);
  // Vous pouvez choisir de continuer même en cas d'erreur Git
}

try {
  // Déployer les commandes
  runCommand('node deploy-commands.js', 'Déploiement des commandes');

  // Démarrer le bot
  runCommand('node index.js', 'Démarrage du bot');
} catch (botError) {
  console.error('Erreur lors du démarrage du bot:', botError);
}

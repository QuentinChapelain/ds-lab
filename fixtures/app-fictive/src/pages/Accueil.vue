<script setup>
const actualites = [
  { titre: 'Les rencontres de printemps', date: '12 mars', texte: 'Trois soirées dans trois villes pour retrouver sa promo et rencontrer les nouvelles.' },
  { titre: 'Le mentorat ouvre ses inscriptions', date: '2 mars', texte: 'Quarante anciens proposent une heure par mois aux diplômés de l’année.' },
  { titre: 'Bilan de l’assemblée générale', date: '18 février', texte: 'Le compte rendu, les comptes et le nouveau bureau.' },
];
</script>

<template>
  <div class="page">
    <section class="bandeau">
      <h1>Bienvenue sur Quai Nord</h1>
      <p class="chapo">Le réseau des anciens : des nouvelles, des rencontres, et des gens à qui écrire.</p>
      <v-btn color="primary" size="large" to="/adhesion" class="adherer">Adhérer</v-btn>
    </section>
    <h2 class="titre-section">Actualités</h2>
    <div class="actualites">
      <v-card v-for="a in actualites" :key="a.titre" class="actualite" elevation="2">
        <v-card-subtitle class="date">{{ a.date }}</v-card-subtitle>
        <v-card-title>{{ a.titre }}</v-card-title>
        <v-card-text>{{ a.texte }}</v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.bandeau {
  padding: 40px 32px;
  margin-bottom: 40px;
  background: #eef6f9;
  border-radius: 12px;
}
.adherer {
  margin-top: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.titre-section {
  font-size: 22px;
  margin-bottom: 16px;
}
.actualites {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.actualite {
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.date {
  font-size: 12px;
  color: #888;
}
</style>

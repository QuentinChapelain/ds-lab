<script setup>
import { ref } from 'vue';

const envoye = ref(false);
const fiche = ref({ prenom: '', nom: '', courriel: '', promo: '', annuaire: true });
const requis = (v) => !!v || 'Champ obligatoire';
</script>

<template>
  <div class="page">
    <h1>Adhésion</h1>
    <p class="chapo">L'adhésion donne accès aux rencontres, au mentorat et à l'annuaire.</p>
    <v-alert v-if="envoye" type="success" variant="tonal" class="confirmation">Merci ! Votre demande est enregistrée.</v-alert>
    <v-form class="formulaire" @submit.prevent="envoye = true">
      <div class="deux">
        <v-text-field v-model="fiche.prenom" label="Prénom" :rules="[requis]" variant="outlined" />
        <v-text-field v-model="fiche.nom" label="Nom" :rules="[requis]" variant="outlined" />
      </div>
      <v-text-field v-model="fiche.courriel" label="Courriel" type="email" :rules="[requis]" variant="outlined" />
      <v-text-field v-model="fiche.promo" label="Promo" hint="Par exemple : Promo 2016" variant="outlined" />
      <v-checkbox v-model="fiche.annuaire" label="Paraître dans l'annuaire des membres" color="primary" />
      <v-btn type="submit" color="primary" class="envoyer">Envoyer ma demande</v-btn>
    </v-form>
  </div>
</template>

<style scoped>
.formulaire {
  max-width: 560px;
}
.deux {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.confirmation {
  max-width: 560px;
  margin-bottom: 24px;
}
.envoyer {
  padding: 0 28px;
  border-radius: 4px;
  text-transform: none;
}
</style>

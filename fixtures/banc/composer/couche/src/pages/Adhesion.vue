<script setup>
import { ref } from 'vue';
import GabaritPage from '../gabarit/GabaritPage.vue';
import DsButton from '../components/ds/DsButton.vue';
import DsTextInput from '../components/ds/DsTextInput.vue';

const envoye = ref(false);
const fiche = ref({ prenom: '', nom: '', courriel: '', promo: '', annuaire: true });
const erreurs = ref({});
const OBLIGATOIRES = ['prenom', 'nom', 'courriel'];

function verifier(champ) {
  erreurs.value[champ] = fiche.value[champ] ? undefined : 'Champ obligatoire';
}
function envoyer() {
  OBLIGATOIRES.forEach(verifier);
  envoye.value = true;
}
</script>

<template>
  <GabaritPage titre="Adhésion" chapo="L'adhésion donne accès aux rencontres, au mentorat et à l'annuaire.">
    <div class="colonne">
      <v-alert v-if="envoye" type="success" variant="flat">Merci ! Votre demande est enregistrée.</v-alert>
      <form class="formulaire" novalidate @submit.prevent="envoyer">
        <div class="deux">
          <DsTextInput v-model="fiche.prenom" label="Prénom" required :error-message="erreurs.prenom" @update:model-value="verifier('prenom')" />
          <DsTextInput v-model="fiche.nom" label="Nom" required :error-message="erreurs.nom" @update:model-value="verifier('nom')" />
        </div>
        <DsTextInput v-model="fiche.courriel" label="Courriel" type="email" required :error-message="erreurs.courriel" @update:model-value="verifier('courriel')" />
        <DsTextInput v-model="fiche.promo" label="Promo" hint="Par exemple : Promo 2016" />
        <v-checkbox v-model="fiche.annuaire" label="Paraître dans l'annuaire des membres" color="primary" hide-details />
        <div class="envoyer">
          <DsButton type="submit">Envoyer ma demande</DsButton>
        </div>
      </form>
    </div>
  </GabaritPage>
</template>

<style scoped>
.colonne,
.formulaire {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-gap-between-components);
}
.colonne {
  max-width: var(--v-ds-width-column);
}
.deux {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(var(--v-ds-width-column) / 3)), 1fr));
  gap: var(--v-ds-gap-between-components);
}
.envoyer {
  display: flex;
}
</style>

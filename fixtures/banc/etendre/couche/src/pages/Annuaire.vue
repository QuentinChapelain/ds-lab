<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { mdiMagnify } from '@mdi/js';
import GabaritPage from '../gabarit/GabaritPage.vue';
import SectionPage from '../gabarit/SectionPage.vue';
import DsAvatar from '../components/ds/DsAvatar.vue';
import DsButton from '../components/ds/DsButton.vue';
import DsCard from '../components/ds/DsCard.vue';
import DsTextInput from '../components/ds/DsTextInput.vue';
import { icone } from '../components/ds/icone.js';
import MemberRow from '../modules/MemberRow.vue';
import MemberTagList from '../modules/MemberTagList.vue';
import { MONTRES, chercher, compte } from '../annuaire/recherche.js';
import { ANIMATION, COUP_DE_MAIN, MEMBRES, PROPOSES } from '../data/membres.js';

const route = useRoute();
const router = useRouter();
const Loupe = icone(mdiMagnify);

const demande = ref('');
const trouves = computed(() => chercher(MEMBRES, demande.value));
const montres = computed(() => trouves.value.slice(0, MONTRES));
const texteDuCompte = computed(() => compte(trouves.value.length, MEMBRES.length, demande.value));

/** Ouvre une adresse de l'app, en gardant la marque et le mode. @param {string} adresse */
function ouvrir(adresse) {
  const cible = router.resolve(adresse);
  router.push({ path: cible.path, query: { ...route.query, ...cible.query } });
}
</script>

<template>
  <GabaritPage titre="Annuaire">
    <template #bandeau>
      <DsCard title="Rechercher un membre" :heading-level="2">
        <form role="search" aria-label="Rechercher un membre" @submit.prevent>
          <DsTextInput v-model="demande" type="search" label="Un nom ou un besoin" hint="Par exemple : Lyon, relire un CV" :prepend-inner-icon="Loupe" autocomplete="off" />
        </form>
      </DsCard>
    </template>

    <DsCard :title="COUP_DE_MAIN.nom" :subtitle="`${COUP_DE_MAIN.misesEnRelation} personnes mises en relation`" :heading-level="2">
      <template #prepend><DsAvatar :name="COUP_DE_MAIN.nom" :image="COUP_DE_MAIN.photo" decorative /></template>
      <template #actions><DsButton @click="ouvrir(COUP_DE_MAIN.demander)">Demander un coup de main</DsButton></template>
    </DsCard>

    <SectionPage titre="Trois personnes pour vous" :chapo="PROPOSES.raison">
      <ul class="proposes" role="list">
        <li v-for="p in PROPOSES.personnes" :key="p.membre.profil" class="proposes__item">
          <DsCard :title="p.membre.nom" :subtitle="p.membre.poste" size="small">
            <template #prepend><DsAvatar :name="p.membre.nom" :image="p.membre.photo" size="large" decorative /></template>
            <div class="propose">
              <MemberTagList v-if="p.membre.ouvertures" :open-to="p.membre.ouvertures" />
              <p class="question">Une question à lui poser&nbsp;: «&nbsp;{{ p.question }}&nbsp;»</p>
            </div>
            <template #actions><DsButton variant="secondary" :aria-label="`Écrire à ${p.membre.nom}`" @click="ouvrir(p.membre.ecrire)">Écrire</DsButton></template>
          </DsCard>
        </li>
      </ul>
    </SectionPage>

    <SectionPage titre="Tous les membres">
      <div>
        <p class="compte" role="status">{{ texteDuCompte }}</p>
        <ul v-if="montres.length" class="liste" role="list">
          <li v-for="m in montres" :key="m.profil" class="liste__item"><MemberRow :member="m" @write="ouvrir(m.ecrire)" /></li>
        </ul>
      </div>
    </SectionPage>

    <DsCard title="Qui anime le réseau" :heading-level="2">
      <ul class="animation" role="list">
        <li v-for="a in ANIMATION" :key="a.nom" class="animation__item">
          <DsAvatar :name="`${a.prenom} ${a.nom}`" :image="a.photo" decorative />
          <div class="animation__texte">
            <span class="animation__nom">{{ a.prenom }} {{ a.nom }}</span>
            <span class="animation__role">{{ a.role }}</span>
          </div>
        </li>
      </ul>
    </DsCard>
  </GabaritPage>
</template>

<style scoped>
.proposes,
.liste,
.animation {
  margin: 0;
  padding: 0;
  list-style: none;
}
.proposes,
.animation {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(var(--v-ds-width-column) / 2.2)), 1fr));
  gap: var(--v-ds-gap-between-components);
}
.proposes__item {
  display: grid;
}
.propose {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-gap-between-blocks);
}
.question,
.compte {
  margin: 0;
  font-family: var(--v-ds-body-small-font-family);
  font-size: var(--v-ds-body-small-font-size);
  font-weight: var(--v-ds-body-small-font-weight);
  line-height: var(--v-ds-body-small-line-height);
}
.compte {
  padding-block-end: var(--v-ds-gap-between-blocks);
  color: rgb(var(--v-ds-text-secondary));
}
.liste__item {
  border-top: var(--v-ds-border-width-default) solid rgb(var(--v-ds-card-border));
}
.animation__item {
  display: flex;
  align-items: center;
  gap: var(--v-ds-gap-between-components);
}
.animation__texte {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.animation__nom {
  font-family: var(--v-ds-heading-4-font-family);
  font-size: var(--v-ds-heading-4-font-size);
  font-weight: var(--v-ds-heading-4-font-weight);
  line-height: var(--v-ds-heading-4-line-height);
}
.animation__role {
  color: rgb(var(--v-ds-text-secondary));
  font-family: var(--v-ds-body-small-font-family);
  font-size: var(--v-ds-body-small-font-size);
  font-weight: var(--v-ds-body-small-font-weight);
  line-height: var(--v-ds-body-small-line-height);
}
</style>

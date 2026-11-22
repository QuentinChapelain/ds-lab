<script setup>
// Le gabarit de toutes les pages : la barre du haut, le bandeau de titre, la largeur du contenu, le pied. Son mode
// d'emploi est dans docs/gabarit.md.
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { mdiWeatherNight, mdiWeatherSunny } from '@mdi/js';
import DsIconButton from '../components/ds/DsIconButton.vue';
import { icone } from '../components/ds/icone.js';
import { MARQUES, estSombre, marqueDe } from '../marques.js';

defineProps({ titre: { type: String, required: true }, chapo: { type: String, default: '' } });

const route = useRoute();
const router = useRouter();
const { xs } = useDisplay();
const Lune = icone(mdiWeatherNight);
const Soleil = icone(mdiWeatherSunny);

const marque = computed(() => marqueDe(route.query));
const sombre = computed(() => estSombre(route.query));
const liens = router.options.routes.map((r) => ({ path: r.path, titre: r.meta.titre }));

function changer(query) {
  router.replace({ query: { ...route.query, ...query } });
}
</script>

<template>
  <v-app-bar class="barre" color="surface" flat>
    <v-app-bar-title v-if="!xs">{{ marque.nom }}</v-app-bar-title>
    <nav v-if="!xs" class="menu" aria-label="Menu">
      <router-link v-for="l in liens" :key="l.path" class="lien" :to="{ path: l.path, query: route.query }">{{ l.titre }}</router-link>
    </nav>
    <v-select
      class="choix-marque"
      :model-value="marque.dossier"
      :items="MARQUES"
      item-title="nom"
      item-value="dossier"
      density="compact"
      hide-details
      variant="outlined"
      label="Marque"
      @update:model-value="(m) => changer({ marque: m })"
    />
    <div class="mode">
      <DsIconButton :icon="sombre ? Soleil : Lune" :label="sombre ? 'Passer en clair' : 'Passer en sombre'" @click="changer({ mode: sombre ? 'clair' : 'sombre' })" />
    </div>
    <template v-if="xs" #extension>
      <nav class="menu menu--etroit" aria-label="Menu">
        <router-link v-for="l in liens" :key="l.path" class="lien" :to="{ path: l.path, query: route.query }">{{ l.titre }}</router-link>
      </nav>
    </template>
  </v-app-bar>
  <v-main class="gabarit">
    <div class="bandeau">
      <div class="cadre bandeau__contenu">
        <div class="bandeau__titre">
          <h1 class="titre">{{ titre }}</h1>
          <p v-if="chapo" class="chapo">{{ chapo }}</p>
        </div>
        <slot name="bandeau" />
      </div>
    </div>
    <div class="cadre contenu">
      <slot />
    </div>
  </v-main>
  <footer class="pied">
    <div class="cadre pied__contenu">
      <span>Quai Nord · Association des anciens</span>
      <a class="pied__lien" href="/mentions">Mentions légales</a>
    </div>
  </footer>
</template>

<style scoped>
/* Barre du haut : sur la surface, séparée par un filet décoratif ; sous 600 px, le menu passe sur une seconde ligne et la
   liste des marques dit seule le nom de la marque. */
.barre {
  border-bottom: var(--v-ds-border-width-default) solid rgb(var(--v-ds-card-border));
}
.menu {
  display: flex;
  gap: var(--v-ds-gap-between-components);
}
.menu--etroit {
  overflow-x: auto;
  margin-inline: var(--v-ds-padding-component);
}
.lien {
  border-radius: var(--v-ds-border-radius-control);
  color: rgb(var(--v-theme-on-interactive-subtle));
  font-family: var(--v-ds-label-font-family);
  font-size: var(--v-ds-label-font-size);
  font-weight: var(--v-ds-label-font-weight);
  line-height: var(--v-ds-label-line-height);
  text-decoration: none;
}
.lien:hover,
.lien[aria-current='page'] {
  text-decoration: underline;
}
.choix-marque {
  flex: 0 1 auto;
  width: calc(var(--v-ds-width-column) / 3);
  margin-inline-start: var(--v-ds-padding-component);
}
.mode {
  display: flex;
  margin-inline: auto var(--v-ds-padding-component);
  padding-inline-start: var(--v-ds-gap-between-components);
}

/* Largeur du contenu de toutes les pages, marge de chaque côté. */
.cadre {
  box-sizing: border-box;
  width: 100%;
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- aucun jeton de largeur de page : celle de l'app, 1 080 px. */
  max-width: 1080px;
  margin-inline: auto;
  padding-inline: var(--v-ds-padding-component);
}

/* Bandeau : l'aplat plein de la marque. */
.bandeau {
  background: rgb(var(--v-theme-brand-strong));
  color: rgb(var(--v-theme-on-brand-strong));
}
.bandeau__contenu {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-gap-between-components);
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- gap.section : jeton que le thème ne porte pas. */
  padding-block: 48px;
}
.bandeau__titre {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-gap-within-component);
}
.titre {
  margin: 0;
  font-family: var(--v-ds-card-title-font-family);
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- typography.heading.1 : style que le thème ne porte pas. */
  font-size: 30px;
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- typography.heading.1 : style que le thème ne porte pas. */
  font-weight: 700;
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- typography.heading.1 : style que le thème ne porte pas. */
  line-height: 1.3333;
  font-size-adjust: cap-height var(--v-ds-card-title-cap-height);
  overflow-wrap: anywhere;
}
.chapo {
  margin: 0;
  font-family: var(--v-ds-body-font-family);
  font-size: var(--v-ds-body-font-size);
  font-weight: var(--v-ds-body-font-weight);
  line-height: var(--v-ds-body-line-height);
}

.contenu {
  display: flex;
  flex-direction: column;
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- gap.section : jeton que le thème ne porte pas. */
  gap: 48px;
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- gap.section : jeton que le thème ne porte pas. */
  padding-block: 48px;
}

.pied {
  border-top: var(--v-ds-border-width-default) solid rgb(var(--v-ds-card-border));
  color: rgb(var(--v-ds-text-secondary));
  font-family: var(--v-ds-body-small-font-family);
  font-size: var(--v-ds-body-small-font-size);
  font-weight: var(--v-ds-body-small-font-weight);
  line-height: var(--v-ds-body-small-line-height);
}
.pied__contenu {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--v-ds-gap-between-components);
  padding-block: var(--v-ds-padding-component);
}
.pied__lien {
  color: inherit;
}
.lien:focus-visible,
.pied__lien:focus-visible {
  outline: var(--v-ds-border-width-focus) solid rgb(var(--v-ds-focus));
  outline-offset: var(--v-ds-offset-focus);
}

@media (width < 600px) {
  .bandeau__contenu,
  .contenu {
    /* stylelint-disable-next-line declaration-property-value-allowed-list -- gap.section, en étroit : jeton que le thème ne porte pas. */
    padding-block: 32px;
  }
  .contenu {
    /* stylelint-disable-next-line declaration-property-value-allowed-list -- gap.section, en étroit : jeton que le thème ne porte pas. */
    gap: 32px;
  }
  .titre {
    /* stylelint-disable-next-line declaration-property-value-allowed-list -- typography.heading.1, en étroit : style que le thème ne porte pas. */
    font-size: 24px;
  }
}
</style>

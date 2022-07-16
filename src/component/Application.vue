<template>
  <v-app class="app">
    <v-main class="d-flex flex-grow-1" style="overflow: hidden;">
      <graph-area
          :graph="graph"
          :stylesheet="visualStyleSheet"
          :left-offset="leftOffset"
          :right-offset="rightOffset"
          :view-options="viewOptions"
          :graph-searcher="graphSearcher"
          :manipulator="manipulator"
          :area-manipulator="areaManipulator"
          :layout-manager="layouts"
          :mode-compact="modeCompact"
          @compact-mode-change="modeCompact = $event"
          @new-manipulator="areaManipulator = $event"
      />
      <side-panel
          :graph="graph"
          :area-manipulator="areaManipulator"
          :manipulator="manipulator"
          :hidden-panel.sync="hiddenPanel"
          :node-locking-supported="layouts.currentLayout.supportsNodeLocking"
          ref="sidePanel"
          @width-changed="rightOffset = $event"
      />
      <v-navigation-drawer absolute permanent width="300">
        <v-list dense nav class="py-0" style="padding-left: 50px;">
          <v-list-item two-line>
            <v-list-item-avatar height="33px">
              KG<br>VB
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>KGVisualBrowser</v-list-item-title>
              <v-list-item-subtitle><a href="https://kgbrowser.opendata.cz/" target="_blank"
                                       class="grey--text text-decoration-none">{{ $t("menu.project_website") }}
                <v-icon small color="grey">{{ icons.projectWebsite }}</v-icon>
              </a></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-divider/>

        <v-tabs v-model="navDrawerTab" height="45px">
          <v-tab style="width: 150px; font-size: 0.8em;">Menu</v-tab>
          <v-tab style="width: 150px; font-size: 0.8em;">Filtering</v-tab>
        </v-tabs>

        <!--Nested navigation-drawer is for layout purposes-->
        <v-navigation-drawer width="300" style="height: calc(100% - 200px);" permanent ref="bar"
                             @update:mini-variant="$refs.languageMenu.isActive = false">

          <v-tabs-items v-model="navDrawerTab">
            <v-tab-item>
              <v-list dense nav class="py-0">
                <v-list-item link @click="$refs.addNode.show()">
                  <v-list-item-icon>
                    <v-icon>{{ icons.add }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.add_nodes") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item link @click="$refs.filterDialog.show()">
                  <v-list-item-icon>
                    <v-badge overlap :value="filter.active" :content="filter.active">
                      <v-icon>{{ icons.filter }}</v-icon>
                    </v-badge>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.filter") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item link @click="$refs.viewOptionsDialog.show()">
                  <v-list-item-icon>
                    <v-badge dot :value="viewOptions.active">
                      <v-icon>{{ icons.viewOptions }}</v-icon>
                    </v-badge>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.view_options") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item link @click="hiddenPanel = !hiddenPanel">
                  <v-list-item-icon>
                    <v-badge dot :value="hiddenPanel">
                      <v-icon>{{ icons.hidden }}</v-icon>
                    </v-badge>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.hidden_nodes") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item link @click="layoutDialog.show()">
                  <v-list-item-icon>
                    <v-icon>{{ icons.layout }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.layout") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-divider></v-divider>

                <v-list-item link @click="askForSaveAndPerformAction(false, loadDialog.show)">
                  <v-list-item-icon>
                    <v-icon>{{ icons.load }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.load") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item link @click="saveToFile()">
                  <v-list-item-icon>
                    <v-icon>{{ icons.save }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.save") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item link @click="newGraphClicked()">
                  <v-list-item-icon>
                    <v-icon>{{ icons.add }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.new_graph") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item link @click="changeConfigurationClicked()">
                  <v-list-item-icon>
                    <v-icon>{{ icons.configuration }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.configuration") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-divider></v-divider>

                <v-list-group :prepend-icon="icons.language" :color="null" ref="languageMenu">
                  <template v-slot:activator>
                    <v-list-item-title>{{ $t("menu.language") }}</v-list-item-title>
                  </template>

                  <v-list>
                    <v-list-item v-for="(messages, code) in this.$root.$i18n.messages" :key="code"
                                 @click="menuLanguageSelected(code)">
                      <v-list-item-title>{{ messages['_lang_local'] }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-list-group>

                <v-list-item link @click="$refs.settingsDialog.show()">
                  <v-list-item-icon>
                    <v-icon>{{ icons.settings }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t("menu.settings") }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-tab-item>

            <v-tab-item>
              <faceted-filtering
                  ref="facetedFiltering"
                  :graph="graph"
                  :configuration="configuration"
                  :remoteServer="server"
                  :manipulator="manipulator"
              />
            </v-tab-item>
          </v-tabs-items>
        </v-navigation-drawer>

        <template v-if="navDrawerTab==0">

        </template>

        <template v-else>
          <v-row
              align="center"
              justify="space-around"
              style="margin-top: 9px;"
          >
            <v-btn
                width="135"
                height="35"
                style="margin-left: 15px; font-size: 0.8em;"
                color="secondary"
                @click="$refs.facetedFiltering.filterBtnPressed()"
            >
              Filter
            </v-btn>

            <v-btn
                width="135"
                height="35"
                style="margin-right: 15px; font-size: 0.8em;"
                color="secondary"
                @click="$refs.facetedFiltering.resetFiltering()"
            >
              Reset
            </v-btn>
          </v-row>

          <v-btn
              @click="$refs.facetedFiltering.reloadFacets()"
              style="margin-top: 15px; margin-left: 15px; font-size: 0.8em;"
              height="35"
              width="269"
              color="primary"

          >
            reload facets
          </v-btn>
        </template>

      </v-navigation-drawer>
    </v-main>

    <v-footer v-if="false" dark padless>
      <v-card class="flex" flat tile>
        <v-card-text class="py-2 white--text">
          <v-progress-circular color="white" indeterminate size="16" width="2" class="mr-1"></v-progress-circular>
          <strong>Fetching resources...</strong> [5 left]
        </v-card-text>
      </v-card>
    </v-footer>

    <add-node
        ref="addNode"
        :graph="graph"
        :manipulator="manipulator"
        :graph-searcher="graphSearcher"
    />
    <filter-dialog
        ref="filterDialog"
        :graph="graph"
        :filter="filter"
    />
    <save-dialog
        ref="saveDialog"
    />
    <vue-filter-component-creator
        :graph="graph"
        :filter="filter"
    />
    <view-options-dialog
        :options="viewOptions"
        ref="viewOptionsDialog"
    />
    <settings-dialog
        :remote-url.sync="server.remoteUrl"
        :metaconfiguration.sync="defaultMetaconfigurationIRI"
        ref="settingsDialog"
    />
    <settings
        :remote-url.sync="server.remoteUrl"
        :metaconfiguration.sync="defaultMetaconfigurationIRI"
    ></settings>
    <load-dialog
        ref="loadDialog"
        :load-url-function="loadFromUrl"
        @selected="loadFromFile($event)"
    />
    <layout-dialog
        ref="layoutDialog"
        :layouts="layouts"
    />
    <graph-vuex
        :graph="graph"
    />
    <configuration-chooser-component
        ref="configurationChooser"
        :default-metaconfiguration="defaultMetaconfiguration"
        :configuration-manager="configurationManager"
        :remote-server="server"
        :graph-searcher="graphSearcher"
        :graph="graph"
        :graph-manipulator="manipulator"
        :mode="configurationChooserComponentMode"
        @configuration-update="changeConfiguration($event)"
        @load-from-file="$refs.loadDialog.show()"
    />
  </v-app>
</template>

<script lang="ts">
import GraphArea from './graph/GraphArea.vue';
import AddNode from './AddNode.vue';
import {RemoteServer} from '../remote-server/RemoteServer';
import {Graph} from '../graph/Graph';
import SidePanel from './side-panel/SidePanel.vue';
import SaveDialog from './SaveDialog.vue';
import FilterDialog from './filter/FilterDialog.vue';
import VueFilterComponentCreator from '../filter/VueFilterComponentCreator';
import Component from "vue-class-component";
import {LocaleMessage} from "vue-i18n";
import {Mixins, Ref, Watch} from "vue-property-decorator";
import {ResponseStylesheet} from "../remote-server/ResponseInterfaces";


import {
  mdiCogs,
  mdiEthernetCable,
  mdiEye,
  mdiFileDownloadOutline,
  mdiFileUploadOutline,
  mdiFilterOutline,
  mdiImageFilterTiltShift,
  mdiLayersTriple, mdiOpenInNew,
  mdiPlusThick,
  mdiTranslate,
} from '@mdi/js';
import {VListGroup, VNavigationDrawer} from "vuetify/lib";
import SettingsDialog from "./SettingsDialog.vue";
import Settings from "./Settings";
import ViewOptionsDialog from "./ViewOptionsDialog.vue";
import ViewOptions from "../graph/ViewOptions";
import {FiltersList} from "../filter/Filter";
import GraphAreaManipulator from "../graph/GraphAreaManipulator";
import GraphManipulator from "../graph/GraphManipulator";
import LoadDialog from "./LoadDialog.vue";
import ApplicationLoadStoreMixin from "./ApplicationLoadStoreMixin";
import GraphSearcher from "../searcher/GraphSearcher";
import Searcher from "../searcher/Searcher";
import LocalGraphSearcher from "../searcher/searchers/LocalGraphSearcher";
import SimpleJsonSearcher from "../searcher/searchers/SimpleJsonSearcher";
import IRIIdentitySearcher from "../searcher/searchers/IRIIdentitySearcher";
import LayoutDialog from "./LayoutDialog.vue";
import {LayoutManager} from "../layout/LayoutManager";
import ColaLayoutSettingsComponent from "../layout/layouts/ColaLayout/ColaLayoutSettingsComponent.vue";
import ColaLayout from "../layout/layouts/ColaLayout/ColaLayout";
import CircleLayoutSettingsComponent from "../layout/layouts/CircleLayout/CircleLayoutSettingsComponent.vue";
import CircleLayout from "../layout/layouts/CircleLayout/CircleLayout";
import ColaLayoutButtons from "../layout/layouts/ColaLayout/ColaLayoutButtons.vue";
import DagreLayout from "../layout/layouts/DagreLayout/DagreLayout";
import DagreLayoutSettingsComponent from "../layout/layouts/DagreLayout/DagreLayoutSettingsComponent.vue";
import DagreLayoutButtons from "../layout/layouts/DagreLayout/DagreLayoutButtons.vue";
import DegreeFilter from "../filter/filters/DegreeFilter/DegreeFilter";
import PropertyFilter from "../filter/filters/PropertyFilter/PropertyFilter";
import GraphVuex from "../graph/component/GraphVuex.vue";
import NodeCommon from "../graph/NodeCommon";
import ConfigurationChooserComponent from "./ConfigurationChooserComponent.vue";
import ConfigurationManager from "../configurations/ConfigurationManager";
import Metaconfiguration from "../configurations/Metaconfiguration";
import Configuration from "../configurations/Configuration";
import ApplicationConfiguration from '../conf';
import {ConfigurationChooserComponentModes} from "@/component/ConfigurationChooserComponent.vue";
import FacetedFiltering from "@/component/facet-filtering/FacetedFiltering.vue";

@Component({
  components: {
    ConfigurationChooserComponent,
    GraphVuex,
    LayoutDialog,
    LoadDialog,
    ViewOptionsDialog,
    Settings,
    SettingsDialog,
    VueFilterComponentCreator,
    GraphArea,
    AddNode,
    SidePanel,
    SaveDialog,
    FilterDialog,
    FacetedFiltering
  }
})
export default class Application extends Mixins(ApplicationLoadStoreMixin) {
  navDrawerTab = null;

  modeCompact: boolean = false;

  /**
   * Class responsible for communication with server.
   * The instance is readonly, but the remote url can be changed
   * */
  readonly server: RemoteServer = new RemoteServer();

  /**
   * Holds current configuration which is applied to graph. Value can be changed as well as its
   * inner values such as stylesheets etc.
   * */
  configuration: Configuration = null;

  /**
   * Container for all nodes and edges which were downloaded by a user.
   * */
  graph: Graph = new Graph();

  /**
   * Helper class for graph are manipulation such as animations, etc.
   *
   * It is created by GraphArea component.
   *
   * @non-reactive Must not be set until Vue inits its reactivity (even null is forbidden)
   * */
  areaManipulator !: GraphAreaManipulator;

  /**
   * Helper class for graph manipulation such as adding multiple nodes, etc.
   *
   * @non-reactive Must not be set until Vue inits its reactivity (even null is forbidden)
   * */
  manipulator !: GraphManipulator;

  /**
   * Simple object containing data how graph should be rendered.
   * Example: Show dots instead of labeled nodes without edges.
   * */
  viewOptions = new ViewOptions();

  /**
   * List of node filters supported in the application.
   * Theoretically, the filter list can be dynamically expanded.
   *
   * It is similar to LayoutsList.
   * */
  filter = new FiltersList([
    DegreeFilter,
    PropertyFilter,
  ]);

  /**
   * List of layouts supported in the application.
   * This list can be dynamically expanded by plugins.
   *
   * Items are constant, that means, that instance of every layout is created only once and remains same even
   * if the whole graph is changed.
   *
   * name - name of the layout used for saving to file
   * settingsComponent - Vue component rendering settings page to the layout
   * layout - the core instance containing parameters and layout algorithms
   *
   * It is similar to FiltersList.
   * */
  layouts = new LayoutManager([
    {
      name: 'cola',
      settingsComponent: ColaLayoutSettingsComponent,
      layout: new ColaLayout(),
      buttons: ColaLayoutButtons,
    },
    {
      name: 'circle',
      settingsComponent: CircleLayoutSettingsComponent,
      layout: new CircleLayout(),
    },
    {
      name: 'dagre',
      settingsComponent: DagreLayoutSettingsComponent,
      layout: new DagreLayout(),
      buttons: DagreLayoutButtons,
    }
  ]);

  /**
   * URI of metaconfiguration which provides a list of configurations
   * */
  defaultMetaconfigurationIRI: string = ApplicationConfiguration["meta-configuration"];

  get defaultMetaconfiguration(): Metaconfiguration {
    return this.configurationManager.getOrCreateMetaconfiguration(this.defaultMetaconfigurationIRI);
  }

  /**
   * Configuration manager manages all so far downloaded configurations and meta configurations from the server.
   * It is not expected to change the instance.
   * */
  readonly configurationManager: ConfigurationManager = new ConfigurationManager();

  //#region Visual Style sheet variable and update logic

  /**
   * Current stylesheet for Cytoscape object which is obtained from current configuration.
   * */
  visualStyleSheet: ResponseStylesheet = {styles: []};

  /**
   * When the stylesheet IRI is changed, this function downloads new visual stylesheet.
   * */
  private async loadStylesheet() {
    // For now, only the first stylesheet is supported
    if (this.configuration?.stylesheet?.length > 0) {
      let stylesheet = await this.graph.server.getStylesheet(this.configuration.stylesheet[0]);
      if (stylesheet === false) {
        console.error("Error occurred while fetching the stylesheet.\nCheck the correctness of IRI, URL of remote server or the internet connection.\nStyles will be emptied.");
        this.visualStyleSheet.styles = [];
      } else {
        this.visualStyleSheet = stylesheet;
      }
    } else {
      this.visualStyleSheet.styles = [];
    }
  }

  //#endregion Visual Style sheet variable and update logic

  //#region References to components used in Application

  @Ref() readonly addNode !: AddNode;
  @Ref() readonly filterDialog !: FilterDialog;
  @Ref() readonly saveDialog !: SaveDialog;
  @Ref() readonly bar !: typeof VNavigationDrawer;
  @Ref() readonly languageMenu !: typeof VListGroup;
  @Ref() readonly settingsDialog !: SettingsDialog;
  @Ref() readonly loadDialog !: LoadDialog;
  @Ref() readonly layoutDialog !: LayoutDialog;
  @Ref() readonly configurationChooser !: ConfigurationChooserComponent;

  //#endregion References to components used in Application

  private rightOffset: number = 0;
  private leftOffset: number = 300;  // A little more than the default width of Vuetify v-navigation-drawer (256)

  // Whether the item "Language" is opened with all the available languages
  // noinspection JSUnusedLocalSymbols
  private languageMenuActive: boolean = false;

  /**
   * If is opened the panel with hidden nodes
   * */
  hiddenPanel: boolean = false;

  // When user clicks on specific language in the left panel
  private menuLanguageSelected(languageCode: string) {
    this.$root.$i18n.locale = languageCode;
    // @ts-ignore types
    this.languageMenu.isActive = false;
  }

  // List of available languages to main menu
  translations: { text: LocaleMessage, value: string }[] = [];

  // List of icons used in main menu
  icons = {
    add: mdiPlusThick,
    filter: mdiFilterOutline,
    viewOptions: mdiEye,
    hidden: mdiImageFilterTiltShift,
    layout: mdiLayersTriple,
    projectWebsite: mdiOpenInNew,

    load: mdiFileUploadOutline,
    save: mdiFileDownloadOutline,

    configuration: mdiEthernetCable,

    language: mdiTranslate,
    settings: mdiCogs,
  };

  private configurationChooserComponentMode: ConfigurationChooserComponentModes = ConfigurationChooserComponentModes.NEW_GRAPH;

  /**
   * When clicked on button to open configuration chooser
   * */
  private newGraphClicked() {
    this.askForSaveAndPerformAction(false, () => {
      this.configurationChooserComponentMode = ConfigurationChooserComponentModes.NEW_GRAPH;
      this.configurationChooser.show();
    });
  }

  private changeConfigurationClicked() {
    this.configurationChooserComponentMode = ConfigurationChooserComponentModes.CHANGE_CONFIGURATION;
    this.configurationChooser.show();
  }

  private changeConfiguration(data: {
    configuration: Configuration,
    newGraph: boolean,
  }) {
    this.configuration = data.configuration;
    if (data.newGraph) {
      this.createNewGraph();
    } else if (this.graph) {
      console.log("Updated configuration", data.configuration);
      this.configuration = data.configuration;
      this.graph.configuration = data.configuration;

      this.loadStylesheet();
      this.updateGraphSearcher();
    }
  }

  /**
   * Creates new graph according to configuration and discards the old one.
   * */
  protected createNewGraph(loadStylesheet: boolean = true) {
    if (!this.areaManipulator) {
      console.error("Creating a new graph, but areaManipulator still not exists.");
    }

    this.graph = new Graph();
    this.graph.server = this.server;
    this.graph.configuration = this.configuration;

    this.areaManipulator.graph = this.graph;
    this.areaManipulator.layoutManager = this.layouts;
    this.layouts.graphChanged(this.graph);
    this.layouts.graphAreaManipulatorChanged(this.areaManipulator);

    this.manipulator = new GraphManipulator(this.graph, this.areaManipulator, this.layouts);

    this.filter.reset();
    this.areaManipulator.resetViewport();

    if (loadStylesheet) this.loadStylesheet();
    this.updateGraphSearcher();
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Vue method called when component is created
   */
  created() {
    // Resolve languages
    for (let code in this.$root.$i18n.messages) {
      this.translations.push({
        text: this.$root.$i18n.messages[code]['_lang_local'],
        value: code
      });
    }

    // Create @non-reactive properties
    this.areaManipulator = null;
    this.manipulator = null;

    // @ts-ignore backdoor to api
    window['kgvb'] = this;
  }

  /**
   * Vue method called when everything is mounted
   */
  mounted() {
    let hideWelcomeScreen = () => {
      let screen = document.getElementById("welcomeScreen");
      screen.style.opacity = '0';
      window.setTimeout(() => {
        screen.remove();
      }, 500);
    };

    // Add watcher after the components are mounted
    this.$watch(
        () => {
          return (this.bar as any).computedWidth
        },
        (val) => {
          this.leftOffset = val;
        }
    );

    let url = new URL(window.location.href);

    let load = url.searchParams.get('load');
    let metaConfiguration = url.searchParams.get('meta-configuration');
    let configuration = url.searchParams.get('configuration');

    if (load) {
      this.loadFromUrl(load).then(() => {
        hideWelcomeScreen();
      });
    } else if (metaConfiguration) {
      this.configurationChooser.show(metaConfiguration);
      hideWelcomeScreen();
    } else if (configuration) {
      this.configurationChooser.showConfiguration(configuration).then(() => {
        hideWelcomeScreen();
      });
    } else {
      // Open configuration chooser
      this.newGraphClicked();
      hideWelcomeScreen();
    }
  }

  /**
   * GraphSearcher can search nodes in current graph, in remote server or construct IRI from ID.
   */
  graphSearcher: GraphSearcher = null;

  /**
   * Method for updating graphSearcher. It depends on graph instance and data source.
   */
  private updateGraphSearcher() {
    if (this.graph) {
      let searchers: Searcher[] = [];

      searchers.push(new LocalGraphSearcher(this.graph));
      if (this.configuration.autocomplete) {
        for (let url of this.configuration.autocomplete) {
          searchers.push(new SimpleJsonSearcher(url));
        }
      }
      // if (this.dataSource.iri_by_id) searchers.push(new IRIConstructorSearcher(this.dataSource.iri_by_id.template, new RegExp(this.dataSource.iri_by_id.id_structure)));
      searchers.push(new IRIIdentitySearcher(this.configuration.resourcePattern ? new RegExp(this.configuration.resourcePattern) : null));

      this.graphSearcher = new GraphSearcher(searchers);
    }
  }

  //#region Check if nodes from graph are selected or a single node from group

  private get allSelectedNodes(): NodeCommon[] {
    let selected = [];
    for (let iri in this.graph.nodes) {
      if (this.graph.nodes[iri].selected) selected.push(this.graph.nodes[iri]);
    }
    return [...selected, ...this.graph.groups.filter(group => group.selected)];
  }

  @Watch('allSelectedNodes')
  private checkSelectedNodes() {
    if (this.allSelectedNodes.length > 1) {
      for (let node of this.allSelectedNodes) {
        if (node !== node.selfOrGroup) {
          node.selected = false;
        }
      }
    }
  }

  //#endregion Check if nodes from graph are selected or a single node from group

  public constructor() {
    super();
    this.server.remoteUrl = ApplicationConfiguration.api;
    this.configurationManager.remoteServer = this.server;
  }
}
</script>
<style>
html {
  overflow: hidden !important;
}

.app {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.v-main__wrap {
  display: flex;
}

.toolbar {
  z-index: 10;
}
</style>

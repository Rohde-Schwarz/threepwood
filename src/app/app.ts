import 'angular';
import {DashboardModule} from "./dashboard";
import {SettingsModule, SettingsService} from "./settings";
import {GitlabApiModule} from "./gitlab-api";

class App {
  static $inject = ['$mdSidenav', 'settingsService'];

  constructor(private $mdSidenav:any,
              private settingsService:SettingsService) {
  }

  configured():boolean {
    return this.settingsService.configured();
  }
  
  openSettings() {
    this.$mdSidenav('sidenav').toggle();
  }
}
const AppComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/app.html',
  controller: App
};

export var AppModule = angular
  .module('app', [
    'ngMaterial',
    DashboardModule.name,
    GitlabApiModule.name,
    SettingsModule.name
  ])
  .value('$routerRootComponent', 'app')
  .config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('success').backgroundPalette('green').dark()
  })
  .config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('running').backgroundPalette('blue').dark()
  })
  .config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('failed').backgroundPalette('red').dark()
  })
  .config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('cancelled').backgroundPalette('grey').dark()
  })
  .config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('unknown').backgroundPalette('yellow').dark()
  })
  .component('app', AppComponent);

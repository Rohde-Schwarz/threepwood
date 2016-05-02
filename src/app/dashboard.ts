import 'angular';
import {BuildsService, BuildsModule, Branch} from "./builds";
import IQService = angular.IQService;
import IPromise = angular.IPromise;
import {BranchCardModule} from "./branch-card";
import {Project} from "./gitlab-api";
import IScope = angular.IScope;
import IIntervalService = angular.IIntervalService;
import {SettingsConfig} from "./settings";

class Dashboard {
  static PROJECTS_RELOAD_INTERVAL = 60 * 60 * 1000; // ms
  static PROJECTS_ERROR_RETRY = 60 * 1000; // ms
  static BUILDS_RELOAD_INTERVAL = 27 * 1000; // ms
  static NEXT_PAGE_INTERVAL = 11 * 1000; // ms
  static $inject = ['buildsService', '$q', '$scope', '$interval'];

  projects:Project[] = [];
  branches:Branch[] = [];
  branchOffset:number = 0;
  rows = [0, 1, 2];

  loading:string = 'Loading matching projects..';
  skipLoadBranchSummary:boolean;

  config:SettingsConfig;

  constructor(private buildsService:BuildsService,
              private $q:IQService,
              private $scope:IScope,
              private $interval:IIntervalService) {

    this.loadProjects();

    // auto reload
    $interval(this.loadProjects.bind(this), Dashboard.PROJECTS_RELOAD_INTERVAL);
    $interval(this.loadBranchSummaries.bind(this), Dashboard.BUILDS_RELOAD_INTERVAL);
    $interval(this.nextPage.bind(this), Dashboard.NEXT_PAGE_INTERVAL);

    // settings have changed, reload..
    $scope.$on('reload:projects', () => {
      this.loading = 'Reloading projects..';
      this.loadProjects();
    });
  }

  nextPage() {
    this.branchOffset += 9;
  }

  row(rowIndex:number):Branch[] {
    if (this.branchOffset >= this.branches.length) {
      this.branchOffset = 0;
    }
    let branches = [];
    let startIndex = this.branchOffset + (rowIndex * 3);
    let lastIndex = startIndex + 3;
    for (let i = startIndex; i < lastIndex; i++) {
      if (this.branches[i]) {
        branches.push(this.branches[i]);
      }
    }
    return branches;
  }

  loadProjects() {
    console.log('loading projects..');
    this.skipLoadBranchSummary = true;
    this.buildsService.loadProjects(this.config.projectMatch)
      .then((projects) => {
        this.skipLoadBranchSummary = false;
        this.projects = projects;
        // if already showing a message, then continue, otherwise stay silent
        if (this.loading) {
          this.loading = 'Loading matching builds..';
        }
        this.loadBranchSummaries();
      })
      .catch(() => {
        console.log('project load failed.. retrying..');
        // if already showing a message, then continue, otherwise stay silent
        if (this.loading) {
          this.loading = `Failed to load projects. Retrying in ${Dashboard.PROJECTS_ERROR_RETRY / 1000} seconds..`;
        }
        this.$interval(this.loadProjects.bind(this), Dashboard.PROJECTS_ERROR_RETRY, 1);
      });
  }

  loadBranchSummaries() {
    if (this.skipLoadBranchSummary) {
      return;
    }
    console.log('loading branch summaries..');
    // to avoid multiple in-flight branch queries
    this.skipLoadBranchSummary = true;
    this.buildsService.loadBranches(this.projects, this.config.branchMatch)
      .then((branchSummaries) => {
        this.branches = branchSummaries;
        this.loading = undefined;
      })
      .finally(() => {
        this.skipLoadBranchSummary = false;
      })
  }
}

const DashboardComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/dashboard.html',
  controller: Dashboard,
  bindings: {
    config: '<'
  }
};

export const DashboardModule = angular
  .module('dashboard', [
    BranchCardModule.name,
    BuildsModule.name
  ])
  .component('dashboard', DashboardComponent);

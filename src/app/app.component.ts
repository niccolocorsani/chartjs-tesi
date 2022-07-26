//@ts-nocheck https://stackoverflow.com/questions/51145180/how-to-use-ts-ignore-for-a-block
import {Component} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Chart, registerables} from "chart.js";
import {LineController} from "chart.js";
import zoomPlugin from 'chartjs-plugin-zoom';
import {ChartjsService} from "../services/chartjs.service";
import {EvaluateDistanceService} from "../services/evaluate-distance.service";
import {GraphdbRequestsService} from "../services/graphdb-requests.service";
import {SvgRequestServiceService} from "../services/svg-request-service.service";
import {GlobalVariablesService} from "../services/global-variables.service";

Chart.register(zoomPlugin);

//  https://stackoverflow.com/questions/67060070/chart-js-core-js6162-error-error-line-is-not-a-registered-controller

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {


  title = 'chartjs';
  time_events: any;
  dataset = [{}]
  jsonObject: any
  over_soglia_list: any
  over_soglia_list_with_info: any
  list_of_scheramte_to_attach = []
  svg = ''
  overSogliaListXristrette: any
  over_soglia_list_with_infoXristrette: any
  restringiAsseLevaImg = true;
  timeEventsXristrette: any
  dataSetXRistrette: any
  soglia = 0
  sogliaXRistrette: any


  myObserver = {
    next: (value: any) => {
      let element = this.chartJsService.createTimeEventsAndDataSetFromJson(value)
      this.dataset = element[0]
      this.time_events = element[1]
    },
    error: (err: any) => {
      console.log('error');
      console.log(err);
    },
  };


  constructor(public http: HttpClient, private chartJsService: ChartjsService, private distanceService: EvaluateDistanceService, private graphDBrequestService: GraphdbRequestsService, private svgRequestService: SvgRequestServiceService, public globalVariableService: GlobalVariablesService) {
    Chart.register(...registerables);
  }


  async ngOnInit() {
    await this.http.get<any>('assets/shap.json').subscribe(this.myObserver);
    await this.delay(1000);
    await this.delay(1000);
    this.chartJsService.render(this.time_events, this.dataset)
  }



  addSoglia() {
    // @ts-ignore
    this.soglia = Number(document.getElementById('input-soglia').value)
    this.chartJsService.addSoglia(this.soglia, this.dataset)
    this.chartJsService.render(this.time_events, this.dataset)
  }

  filterByTreshold() {
    this.over_soglia_list = this.chartJsService.filterDataSetByThreshold(this.dataset, this.soglia)[1]
    this.over_soglia_list_with_info = this.over_soglia_list

  }

  async analizzaVariabili() {
    try {
      this.over_soglia_list = this.over_soglia_list.filter((obj: any) => {
        return obj !== 'soglia' || obj !== 'prediction'
      });
      this.over_soglia_list_with_info = this.over_soglia_list
      let element = this.soglia = (document.getElementById('variabile').value)
      let el1 = this.distanceService.variables[element]
      let nomeEl2
      for (const element1 of this.over_soglia_list) {
        nomeEl2 = element1
        let el2 = this.distanceService.variables[element1]
        if (el1.impianto[0] == el2.impianto[0] && el1.label != el2.label) {
          console.log('stesso impianto')
          const index = this.over_soglia_list_with_info.indexOf(nomeEl2);
          let distance = await this.graphDBrequestService.getDistanceBetweenNodes(el1.label, el2.label)
          this.over_soglia_list_with_info[index] = this.over_soglia_list_with_info[index] + ' Schermata : ' + el2.impianto[0] + ' ---------' + element + ' Schermata : ' + el1.impianto[0] + ' distanza nodi = ' + String(Number(distance) + 1)

        }
        if (el1.impianto[0] != el2.impianto[0]) {
          console.log('impianti diversi')
          continue

        }
      }
    } catch (e) {
      console.log(e)
    }

  }

  async cambiaLeX() {
    this.restringiAsseLevaImg = false

    let timesEvent: any

    let dataSet: any

    let date1 = new Date(document.getElementById('x1').value).getTime()
    let date2 = new Date(document.getElementById('x2').value).getTime()

    this.http.get<any>('assets/shap.json').subscribe(async value => {
      let listOfDate = Object.keys(value)
      let dates = listOfDate.map(date => new Date(date).getTime())

      console.log(Object.keys(value).length)


      var counter = 0


      for (const date of dates) {
        if (date < date1 || date > date2) {
          let dateToRemove = new Date(date)


          let year = String(dateToRemove.getFullYear())
          let month = String(dateToRemove.getMonth() + 1)
          if (month.length == 1) month = '0' + month
          let day = String(dateToRemove.getDate())
          let hour = String(dateToRemove.getHours())
          if (hour.length == 1) hour = '0' + hour
          let minute = String(dateToRemove.getMinutes())
          if (minute.length == 1) minute = '0' + minute
          let second = String(dateToRemove.getSeconds())
          if (second.length == 1) second = '0' + second


          let stringDate = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second


          let lenBefore = Object.keys(value).length
          delete value[stringDate]
          let lenAfter = Object.keys(value).length
          if (lenBefore == lenAfter) // to check if the delition has been correclty done
          {
            console.log(stringDate)
            counter = counter + 1
          }
        }
      }
      console.log('problem with n elements: ' + counter)
      console.log(Object.keys(value).length)
      let element = this.chartJsService.createTimeEventsAndDataSetFromJson(value);
      dataSet = element[0];
      timesEvent = element[1];
    });
    await this.delay(1000);
    console.log(timesEvent)
    this.chartJsService.renderWithRange(timesEvent, dataSet)
    this.dataSetXRistrette = dataSet
    this.timeEventsXristrette = timesEvent
  }

  addSogliaXristrette() {
    // @ts-ignore
    this.sogliaXRistrette = Number(document.getElementById('input-soglia-x-ristrette').value)
    this.chartJsService.addSoglia(this.sogliaXRistrette, this.dataSetXRistrette)
    this.chartJsService.renderWithRange(this.timeEventsXristrette, this.dataSetXRistrette)

  }

  filterByTresholdXristrette() {
    this.overSogliaListXristrette = this.chartJsService.filterDataSetByThreshold(this.dataSetXRistrette, this.sogliaXRistrette)[1]
    this.over_soglia_list_with_infoXristrette = this.overSogliaListXristrette
    this.globalVariableService.nodiRotti = this.overSogliaListXristrette
  }

  async analizzaVariabiliXristrette() {


    try {
      this.overSogliaListXristrette = this.overSogliaListXristrette.filter((obj: any) => {
        return obj !== 'soglia' || obj !== 'prediction'
      });
      this.over_soglia_list_with_infoXristrette = this.overSogliaListXristrette
      let element = this.soglia = (document.getElementById('variabileXristrette').value)
      let el1 = this.distanceService.variables[element]
      let nomeEl2
      for (const element1 of this.overSogliaListXristrette) {
        nomeEl2 = element1
        let el2 = this.distanceService.variables[element1]
        if (el1.impianto[0] == el2.impianto[0] && el1.label != el2.label) {
          console.log('stesso impianto')
          const index = this.over_soglia_list_with_infoXristrette.indexOf(nomeEl2);
          let distance = 'x'
          distance = await this.graphDBrequestService.getDistanceBetweenNodes(el1.label, el2.label)
          if (distance == '9')
            this.over_soglia_list_with_infoXristrette[index] = this.over_soglia_list_with_infoXristrette[index] + ' Nome in ontologia: ' + el2.label + ' Schermata: ' + el2.impianto[0] + ' - ' + element + ' Nome in ontologia: ' + el1.label + ' Schermata: ' + el1.impianto[0] + ' distanza nodi = ' + String(Number(distance) + 1)
        }
        if (el1.impianto[0] != el2.impianto[0]) {
          console.log('impianti diversi')
          continue

        }
      }
    } catch (e) {
      console.log(e)
    }

  }

  async analizzaVariabiliXristretteNonTraLeVariabili() {

    let distance;
    try {
      this.overSogliaListXristrette = this.overSogliaListXristrette.filter((obj: any) => {
        return obj !== 'soglia' || obj !== 'prediction'
      });
      this.over_soglia_list_with_infoXristrette = this.overSogliaListXristrette
      let element = this.soglia = (document.getElementById('nonTraVariabili').value)
      let el1 = element
      let nomeEl2

      for (const element1 of this.overSogliaListXristrette) {
        nomeEl2 = element1

        let el2 = this.distanceService.variables[element1]
        const index = this.over_soglia_list_with_infoXristrette.indexOf(nomeEl2);
        distance = await this.graphDBrequestService.getDistanceBetweenNodes(el1, el2.label)
        if (distance != '9')
          this.over_soglia_list_with_infoXristrette[index] = this.over_soglia_list_with_infoXristrette[index] + ' Nome in ontologia: ' + el2.label + ' Schermata: ' + el2.impianto[0] + ' - ' + element + ' Nome in ontologia: ' + el1 + ' distanza nodi = ' + String(Number(distance) + 1)
      }

    } catch (e) {
      console.log(e)
    }

  }

  async generaSVG() {
    this.svg = await this.svgRequestService.getSVG(this.overSogliaListXristrette, this.list_of_scheramte_to_attach)
  }

  openInNewTab(url: string) {
    window.open(url, '_blank').focus();
  }

  onChange(event: Event) {
    console.log(event.target.value)
    if (this.list_of_scheramte_to_attach.includes(event.target.value)) {
      this.removeElementFromStringArray(event.target.value, this.list_of_scheramte_to_attach)
    } else
      this.list_of_scheramte_to_attach.push(event.target.value)
    console.log(this.list_of_scheramte_to_attach)
  }

  removeElementFromStringArray(element: string, list: []) {
    list.forEach((value, index) => {
      if (value == element) list.splice(index, 1);
    });
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

}

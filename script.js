'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout{
    date = new Date();
    id = (Date.now()+'').slice(-10);
    // clicks = 0;

    constructor(coords,distance,duration){
        this.coords = coords; //[lat,long]
        this.distance = distance;
        this.duration = duration;
    }
    _setDescription(){
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
        }

    // _click(){
    //     this.clicks++;
    // }
}
class Running extends Workout{
    type = "running"
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace(){
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace
    }
}
class Cycling extends Workout{
    type = "cycling"
    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed(){
        // km/hr
        this.speed = this.distance / (this.duration / 60)
        return this.speed;
    }
}
const run = new Running()
const cycling = new Cycling()


///////   application architecture   /////////////
class App{
    #map; //private instance properties
    #mapEvent;
    #workouts = [];
    #zoomLevel=13;
    
    constructor() {
        // get users position
        this._getPosition();

        // get data from local storage
        this._getLocalStorage();

        // attach event handlers
        form.addEventListener('submit',this._newWorkout.bind(this));
        
        inputType.addEventListener('change',this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._movetoPopup.bind(this));

    }

    _getPosition() {
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function(){
                    alert('could not get your position');
                })
            }
    }

    _loadMap(position) {
            const {latitude} = position.coords;
            const {longitude} = position.coords;
            console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    
            const coords = [latitude,longitude];
            this.#map = L.map('map').setView(coords, this.#zoomLevel);
            // console.log(map);
    
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
    
    
            // handling clicks on map
            this.#map.on('click',this._showForm.bind(this));
            this.#workouts.forEach(work=>{
                this._renderWorkoutMarker(work);
            })
                
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
                form.classList.remove('hidden');
                inputDistance.focus();
    }

    _hideForm(){
        // clear input fields
    
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value ="";
        form.style.display='none';
        form.classList.add('hidden');
        setTimeout(()=>form.style.display = 'grid',1000)
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(e) {

        const validInputs = (...inputs)=>
            inputs.every(inp => Number.isFinite(inp))

        const allPositive = (...inputs)=>
            inputs.every(inp=> inp>0)

        e.preventDefault();

        // get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat,lng} = this.#mapEvent.latlng;
        let workout;
        
        
        // check if the data is valid
        
        // if workout running , create a running object
        if(type==='running'){
            const cadence = +inputCadence.value;
            
            if(!validInputs(distance,duration,cadence) || !allPositive(distance,duration,cadence)){ 
                return alert('inputs have to be positive numbers!')
            }
            workout = new Running([lat,lng],distance,duration,cadence);
        }
        
        // if workout cycling , create a cycling object
        if(type==='cycling'){
            const elevation = +inputElevation.value;

            if(!validInputs(distance,duration,elevation) || !allPositive(distance,duration)){
                return alert('inputs have to be positive numbers')
            }
            workout = new Cycling([lat,lng],distance,duration,elevation)
        }
        
        // add new object to the workout array
        this.#workouts.push(workout);
        // console.log(this.#workouts)

        
        // render workout on map as a marker
        this._renderWorkoutMarker(workout)
        
        
        // render the new workout on the list
        this._renderWorkout(workout)
        
        // hide the form and clear the input fields
        this._hideForm();
        
        // set the local storage to all the workouts
        this._setLocalStorage();
        
    }
    _renderWorkoutMarker(workout){
        
        // display marker
        // console.log(mapEvent);
        

        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose:false,
            closeOnClick:false,
            className:`${workout.type}-popup`,
        }))
        .setPopupContent(`${workout.type==='running'?'🏃‍♂️':'🚴‍♀️'} ${workout.description}`)
        .openPopup();
    }
    _renderWorkout(workout){
        let html = `<li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type==='running'?'🏃‍♂️':'🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`

          if(workout.type==="running")
            html+= 
        `<div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>`

        if(workout.type==="cycling")
            html+=
        `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> `

        form.insertAdjacentHTML('afterend',html)
    }
    _movetoPopup(e){
        const workoutEl = e.target.closest('.workout');
        if(!workoutEl) return 

        const workout = this.#workouts.find(
            work => work.id ===workoutEl.dataset.id
        )
        this.#map.setView(workout.coords,this.#zoomLevel,{
            animate:true,
            pan:{
                duration:1
            }
        })
        console.log(workout);
        // workout._click();
    }
    _setLocalStorage(){
        localStorage.setItem('workouts',JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));
        // console.log(data)

        if(!data) return;
        this.#workouts = data;

        this.#workouts.forEach(work=>{
            this._renderWorkout(work);
        })
    }
    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
}
const app = new App();

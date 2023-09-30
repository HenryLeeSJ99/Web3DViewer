import { AmbientLight, AxesHelper, DirectionalLight, GridHelper, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { Raycaster, Vector2, MeshLambertMaterial } from "three";
// import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree} from "three-mesh-bvh";
import { IFCWALLSTANDARDCASE, IFCSLAB, IFCDOOR, IFCWINDOW, IFCFURNISHINGELEMENT, IFCMEMBER, IFCPLATE } from "web-ifc";
import * as dat from 'dat.gui';
import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
import * as THREE from 'three';
import CameraControls from "camera-controls";
CameraControls.install( { THREE: THREE } );
import gsap from "gsap";

//#region UI Controller
function addLoadingScreen(){
  document.getElementById("loading").classList.remove("loader--hidden");
}

function removeLoadingScreen(){
  document.getElementById("loading").classList.add("loader--hidden");
}

//Get models drop down
const modelsDropDown = document.getElementById("modelsDropDown");

// updateModelsDropDown
function updateModelsDropDown(fileName){
  let option = document.createElement("option");
  option.setAttribute('value', fileName);

  let optionText = document.createTextNode(fileName);
  option.appendChild(optionText);

  modelsDropDown.appendChild(option);
}
//#endregion

//#region URLParams
//Setting Up
const queryString = window.location.search;
console.log("Querystring =" + queryString);
const urlParams = new URLSearchParams(queryString);

//
function setModel(fileName){
  //Set Url Params
  urlParams.set('model',fileName);

  //Update Url
  history.replaceState(null, null, "?" + urlParams.toString());
}

function getUrlModelParam(){
  return urlParams.get('model');
}

//#endregion

//#region Firebase
//Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYH1tD_8O-mOHrP_kFiKl_jAAbsHlJ3E8",
  authDomain: "henry3dviewer.firebaseapp.com",
  projectId: "henry3dviewer",
  storageBucket: "henry3dviewer.appspot.com",
  messagingSenderId: "476216862286",
  appId: "1:476216862286:web:f899f27e6d08ca1c8dc51f",
  measurementId: "G-8H1GZX6RN4"
};

//Initialise firebase
initializeApp(firebaseConfig);

//Ref to firebase storage bucket
const storage = getStorage();

// fetch all files in Model folder
// Create a reference under which you want to list
//Container to store all models information
var modelsKvp = [];

function listAllFiles(folder){
  const storage = getStorage();

  const listRef = ref(storage, folder);

  listAll(listRef)
  .then((res) => {
    res.prefixes.forEach((folderRef) => {
      // All the prefixes under listRef.
      // You may call listAll() recursively on them.
    });
    res.items.forEach((itemRef) => {
      // All the items under listRef.

      // Grab Metadata
      getMetadata(itemRef).then((metadata) => {
        modelsKvp.push({ 
          fileName : metadata.name,
          fileSize : metadata.size/(10**6)
        });

        updateModelsDropDown(metadata.name);
      })
      .catch((error) => {
        console.log(error);
      });

      getDownloadURL(itemRef).then((url) => {
        console.log("download Url: " + url);
      });
    });
  }).catch((error) => {
    // Uh-oh, an error occurred!
    console.log(error);
  });
}


function listAndConsoleLog()
{
  listAllFiles("IfcModels/")
  modelsKvp.forEach(element => {
    console.log("Filename : " + element.fileName, "Filesize : " + element.fileSize);
  });
} 

listAndConsoleLog();

// Get the download URL

//#region firebase functions
//function to fetch model from server



//#endregion


// Create a reference under which you want to list
// const listRef = ref(storage, 'IfcModels/');
// console.log(listRef);

// var modelsList = [];

// // Find all the prefixes and items.
// listAll(listRef)
//   .then((res) => {
//     res.prefixes.forEach((folderRef) => {
//       // All the prefixes under listRef.
//       // You may call listAll() recursively on them.
//     });
//     res.items.forEach((itemRef) => {
//       modelsList.push(itemRef);
//       getDownoadURL(itemRef).then((url) => {
//         console.log("download url:" + url);
//       })
//     });
//   }).catch((error) => {
//     console.log(error);
//     // Uh-oh, an error occurred!
//   });

// console.log(modelsList.length);
//#endregion

//#region Three Js Viewer
//Set Up three.js scene*******************************************************************************************************************************
//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
var size = {
  width: ((window.innerWidth)),
  height: (window.innerHeight - 88),
};

const clock = new THREE.Clock();

//Creates the camera (point of view of the user)
const aspect = size.width / size.height;
const camera = new PerspectiveCamera(75, aspect);
const orthoCamera = new THREE.OrthographicCamera( size.width / - 200, size.width / 200, size.height / 200, size.height / - 200, 1, 1000)

//Current active camera {default is perspective}
var activeCamera = camera;

//Initial camera position
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5); //Ambient light to light up the whole scene
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({
  canvas: threeCanvas,
  alpha: true,
});


//Set up camera control
const cameraControls = new CameraControls(camera, renderer.domElement);

//enable local clipping 
renderer.localClippingEnabled = true;

renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(100, 60);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
// controls.target.set(-2, 0, 0);

// Set Up three axis Clipping Planes
const x = new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 0 );
const y = new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0 );
const z = new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 0 );

// Clipper Materials
const geometryX = new THREE.PlaneGeometry(10, 10, 32, 32);
const clipMaterialX = new THREE.MeshBasicMaterial({ 
  color: 0x00ff00,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.1
});

// Create the meshes for the planes for anchoring
const xMesh = new THREE.Mesh(geometryX, clipMaterialX);

const geometryY = new THREE.PlaneGeometry(10, 10, 32, 32);
const clipMaterialY = new THREE.MeshBasicMaterial({ 
  color: 0x00ff00,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.1
});

// Create the meshes for the planes for anchoring
const yMesh = new THREE.Mesh(geometryY, clipMaterialY);

const geometryZ = new THREE.PlaneGeometry(10, 10, 32, 32);
const clipMaterialZ = new THREE.MeshBasicMaterial({ 
  color: 0x00ff00,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.1
});

// Create the meshes for the planes for anchoring
const zMesh = new THREE.Mesh(geometryZ, clipMaterialZ);


// Align the direction of the mesh with the plane vector
const quaternionX = new THREE.Quaternion();
quaternionX.setFromUnitVectors(new THREE.Vector3(0, 0, 1), x.normal);
xMesh.applyQuaternion(quaternionX);

const quaternionY = new THREE.Quaternion();
quaternionY.setFromUnitVectors(new THREE.Vector3(0, 0, 1), y.normal);
yMesh.applyQuaternion(quaternionY);

const quaternionZ = new THREE.Quaternion();
quaternionZ.setFromUnitVectors(new THREE.Vector3(0, 0, 1), z.normal);
zMesh.applyQuaternion(quaternionZ);

// Add the mesh to the scene
scene.add(xMesh);
scene.add(yMesh);
scene.add(zMesh);

// Function to anchor the plane to the mesh
function updateClippingPlane() {
  const positionX = xMesh.position.clone(); // Get the mesh position
  const positionZ = zMesh.position.clone(); // Get the mesh position
  const positionY = yMesh.position.clone(); // Get the mesh position

  // Update the clipping plane with the new position and rotation
  // x.normal.set(1, 0, 0); // Adjust normal based on your needs
  x.constant = positionX.dot(x.normal) * -1;
  z.constant = positionZ.dot(z.normal) * -1;
  y.constant = positionY.dot(y.normal) * -1;
}

// Function to handle mouse events (toggle camera controls)
function handleMouseEvent(e) {
  console.log("Mouse event: " + e.type);
  cameraControls.enabled = e.type === "mouseUp";
}

// Function to create and configure TransformControls
function createTransformControls(mesh, dir) {
  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.attach(mesh);

  // Event listeners
  transformControls.addEventListener('mouseDown', handleMouseEvent);
  transformControls.addEventListener('mouseUp', handleMouseEvent);
  transformControls.addEventListener("objectChange", () => {
    updateClippingPlane();
    console.log(mesh.name + " moved!");
  });

  // Configuration
  transformControls.setMode('translate');
  transformControls.setSpace('local');

  // Set movable axis
  switch (dir) {
    case x:
      transformControls.showX = false;
      transformControls.showY = false;
      break;
    case z:
      transformControls.showX = false;
      transformControls.showY = false;
    case y:
      transformControls.showX = false;
      transformControls.showY = false;
      break;
  }

  // Add to scene
  scene.add(transformControls);

  return transformControls;
}

// Add transformcontrols to the mesh
const transformControlsX = createTransformControls(xMesh,x);
const transformControlsZ = createTransformControls(zMesh,z);
const transformControlsY = createTransformControls(yMesh,y);

const transformControls = {
  xMesh : transformControlsX,
  zMesh : transformControlsZ,
  yMesh : transformControlsY
}
  
// Loop through each property in 'transformControls'
for (const key in transformControls) {
  if (transformControls.hasOwnProperty(key)) {
    // Hide the mesh
    const mesh = transformControls[key].object;
    mesh.visible = false;

    // Hide the corresponding TransformControls
    transformControls[key].visible = false;
  }
}

renderer.render(scene, camera);

// Animation loop
const animate = () => {
  controls.update();
  const delta = clock.getDelta();
  requestAnimationFrame(animate);

  cameraControls.update( delta );

  renderer.render( scene, camera );
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
  size.width = (window.innerWidth);
  size.height = (window.innerHeight - 88);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});
// Container to store all the clipping planes
const clippingPlanes = [];

// Initial clipping status
const clippingStatus = {
  clipX: false,
  clipY: false,
  clipZ: false,
};

// Function to toggle clipping for a given axis
function toggleClipping(axis) {
  // Toggle the clipping status for the specified axis
  clippingStatus[axis] = !clippingStatus[axis];

  // Update the clippingPlanes array based on the current clipping status
  clippingPlanes.length = 0; // Clear the array
  if (clippingStatus.clipX) {
    clippingPlanes.push(x);
  }
  if (clippingStatus.clipY) {
    clippingPlanes.push(y);
  }
  if (clippingStatus.clipZ) {
    clippingPlanes.push(z);
  }

  // Set visibility and transform controls for all axes
  xMesh.visible = clippingStatus.clipX;
  yMesh.visible = clippingStatus.clipY;
  zMesh.visible = clippingStatus.clipZ;

  transformControlsX.enabled = clippingStatus.clipX;
  transformControlsX.visible = clippingStatus.clipX;
  transformControlsY.enabled = clippingStatus.clipY;
  transformControlsY.visible = clippingStatus.clipY;
  transformControlsZ.enabled = clippingStatus.clipZ;
  transformControlsZ.visible = clippingStatus.clipZ;

  // Apply clipping planes to child meshes
  ifcLoadedModel[0].traverse((child) => {
    if (child.isMesh) {
      child.material.clippingPlanes = clippingPlanes;
      child.material.needsUpdate = true;

      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          mat.clippingPlanes = clippingPlanes;
          mat.needsUpdate = true;
        });
      }
    }
  });
}

// Toggle button for clipping in X axis
const toggleClipXButton = document.getElementById('cutSectionXBtn');
toggleClipXButton.addEventListener('click', () => {
  toggleClipping('clipX');
});

// Toggle button for clipping in Y axis
const toggleClipYButton = document.getElementById('cutSectionYBtn');
toggleClipYButton.addEventListener('click', () => {
  toggleClipping('clipY');
});

// Toggle button for clipping in Z axis
const toggleClipZButton = document.getElementById('cutSectionZBtn');
toggleClipZButton.addEventListener('click', () => {
  toggleClipping('clipZ');
});


//#region setUp IFC loader
//IFC Loader*****************************************************************************************************************************************
// Sets up the IFC loader
const ifcLoader = new IFCLoader();

//Sets up optimized picking
// ifcLoader.ifcManager.setupThreeMeshBVH(computeBoundsTree, disposeBoundsTree, acceleratedRaycast);

var ifcLoadedModel = []; // Container to store the IFC models

ifcLoader.ifcManager.setWasmPath("../"); // Sets up wasm location

//IFC Manager
const ifc = ifcLoader.ifcManager;

// function loadIFC(ifcPath){
//   ifcLoader.load(ifcPath, async (ifcModel) => {
//     ifcModels.push(ifcModel);
//     await setupAllCategories();
//   })
// }
function getBoundingBox(model){
  const boundingBox = new THREE.Box3();

  //Iterate through all objects in the scene to calculate the bounding box
  model.traverse((object) => {
    if (object.isMesh) {
      const geometry = object.geometry;
      geometry.computeBoundingBox();
      boundingBox.expandByObject(object);
    }
  });
  return boundingBox;
}


function loadIFC(ifcPath, fileName){
  //Add loading screen to UI
  addLoadingScreen();

  ifcLoader.load(ifcPath, (ifcModel) => {

    scene.remove(ifcLoadedModel[0]);
    
    ifcLoadedModel[0] = ifcModel;

    scene.add(ifcModel);

    fitCameraToScene(camera,scene);

    //Remove loading screen
    removeLoadingScreen();
  })
}
//#endregion

// Get Dom Element
const progressBar = document.getElementById("progressBar");
const progress = document.getElementById("progress");

//Load IFC from remote server
function loadModelWithFileName(fileName){
  //Firebase Ref
  const modelRef = ref(storage, ('IfcModels/' + fileName));

  getDownloadURL(modelRef)
  .then((url) => {
    //This can be downloaded directly:
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';

    //Bring Up Progress Bar
    progressBar.style.visibility = "visible"

    //Listen for 'progress' event
    xhr.onprogress = event => {
      // event.loaded returns how many bytes are downloaded
      // event.total returns the total number of bytes
      // event.total is only available if server sends `Content-Length` header
      // console.log(`Downloaded ${event.loaded} of ${event.total} bytes`)

      progress.style.width = `${event.loaded/event.total * 100}%`;
      console.log(`Downloaded ${Math.round(event.loaded/event.total) * 100}%`)
    }

    xhr.onload = (event) => {
      const blob = xhr.response;
      link = URL.createObjectURL(blob);

      //Load IFC file
      progressBar.style.visibility = "hidden"
      loadIFC(link, fileName);

    };
    xhr.open('GET', url);
    xhr.send()

    setModel(fileName);
    console.log("Fetch Model Success");
  })
  .catch((error) => {
    // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
    switch (error.code) {
      case 'storage/object-not-found':
        console.log("File doesn't exist")
        break;
      case 'storage/unauthorized':
        console.log("User doesn't have permission to access the object")
        break;
      case 'storage/canceled':
        console.log("User canceled the upload")
        break;
  
      // ...
  
      case 'storage/unknown':
        // Unknown error occurred, inspect the server response
        break;
    }
  });
}

//Load the current model in url
loadModelWithFileName(getUrlModelParam());


// Load ifc file from input button
const input = document.getElementById("file-input");
input.addEventListener(
  "change",
  (changed) => {
    //References to input file
    const file = changed.target.files[0];

    //Accepted file type
    const acceptedTypes = ['.ifc', '.ifczip', '.ifcxml']; // Define IFC file extensions here

    // Get the file extension
    const fileExtension = file.name.toLowerCase().slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2);

    if (acceptedTypes.includes('.' + fileExtension)) {
      // Proceed with further actions for IFC files here
      var ifcURL = URL.createObjectURL(file);

      //Load IFC
      loadIFC(ifcURL);


    } else {
      alert('File is not an IFC file. Please choose an IFC file.');
    }
  },
  false
);

//State for Bounding box
var isBoundingBoxVisible = false;
var wireframeBoxHelper;

//Show the bounding box of the element
function createBoundingBox(boundingBox){

  // Create a wireframe material
  const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  // Calculate dimensions and center of the bounding box
  const boxDimensions = boundingBox.getSize(new THREE.Vector3());
  const boxCenter = boundingBox.getCenter(new THREE.Vector3());

  // Create a wireframe box
  const wireframeGeometry = new THREE.BoxGeometry(boxDimensions.x, boxDimensions.y, boxDimensions.z);
  const wireframeBox = new THREE.Mesh(wireframeGeometry, wireframeMaterial);

  wireframeBox.position.copy(boxCenter);

  renderer.render(scene, camera); 
  return wireframeBox;
}

const boundingBoxButton = document.getElementById("boundingBoxBtn");
boundingBoxButton.addEventListener(
  "click",
  () => {
  toggleBoundingBox();
  console.log("Toggle BoundingBox Button Clicked");}
);

function toggleBoundingBox() {
  if (wireframeBoxHelper) {
    if (isBoundingBoxVisible) {
      scene.remove(wireframeBoxHelper);
      isBoundingBoxVisible = !isBoundingBoxVisible;
  } else {
      scene.add(wireframeBoxHelper);
      isBoundingBoxVisible = !isBoundingBoxVisible;
  }
  } else {
    console.log("no bounding box generated yet");
  }
}

//Get Fit Camera Button
const fitCameraButton = document.getElementById("zoomToExtentBtn");
fitCameraButton.addEventListener(
  "click",
  () => {
  fitCameraToScene();
  console.log("Fit to Scene Button Clicked");}
);


function paddingInCssPixel( model, top, right, bottom, left ) {
  //Set up bounding box
  const boundingBox = new THREE.Box3();

  //Iterate through all objects in the scene to calculate the bounding box
  model.traverse((object) => {
    if (object.isMesh) {
      const geometry = object.geometry;
      geometry.computeBoundingBox();
      boundingBox.expandByObject(object);
    }
  });

  //Get Bounding Box Size
  const size = boundingBox.getSize( new THREE.Vector3() );

  //Get View port properties
	const fov = camera.fov * THREE.MathUtils.DEG2RAD;
	const rendererHeight = renderer.getSize(new THREE.Vector2()).height;

	// const boundingBox = new THREE.Box3().setFromObject( mesh );
	const boundingWidth  = size.x;
	const boundingHeight = size.y;
	const boundingDepth  = size.z;

  // find the distancetoFit
	var distanceToFit = cameraControls.getDistanceToFitBox( 
    boundingWidth, boundingHeight, boundingDepth );
	var paddingTop = 0;
	var paddingBottom = 0;
	var paddingLeft = 0;
	var paddingRight = 0;

	// loop to find almost convergence points
	for ( var i = 0; i < 10; i ++ ) {

		const depthAt = distanceToFit - boundingDepth * 0.5;
		const cssPixelToUnit = ( 2 * Math.tan( fov * 0.5 ) * Math.abs( depthAt ) ) / rendererHeight;
		paddingTop = top * cssPixelToUnit;
		paddingBottom = bottom * cssPixelToUnit;
		paddingLeft = left * cssPixelToUnit;
		paddingRight = right * cssPixelToUnit;

		distanceToFit = cameraControls.getDistanceToFitBox(
			boundingWidth + paddingLeft + paddingRight,
			boundingHeight + paddingTop + paddingBottom,
			boundingDepth
		);

	}

	cameraControls.fitToBox(model, true, { 
    paddingLeft: paddingLeft, 
    paddingRight: paddingRight, 
    paddingBottom: paddingBottom, 
    paddingTop: paddingTop
  } );
}

function fitCameraToScene() {
  if(ifcLoadedModel.length > 0){
    const boundingBox = new THREE.Box3();

    //Get Bounding Box Size
    const boundingBoxSize = new THREE.Vector3();

    //Iterate through all objects in the scene to calculate the bounding box
    ifcLoadedModel[0].traverse((object) => {
      if (object.isMesh) {
        const geometry = object.geometry;
        geometry.computeBoundingBox();
        boundingBox.expandByObject(object);
      }
    });

    const center = new THREE.Vector3();
    
    boundingBox.getCenter(center);
    
    // Show bounding box
    wireframeBoxHelper = createBoundingBox(boundingBox);
    
    paddingInCssPixel(ifcLoadedModel[0],0,0,0,0);

    // Update Grid
    grid.position.x = center.x;
    grid.position.y = center.y - boundingBox.getSize(boundingBoxSize).y/2;
    grid.position.z = center.z;
    

    for (const key in transformControls) {
      if (transformControls.hasOwnProperty(key)) {
        // Hide the mesh
        const mesh = transformControls[key].object;
        mesh.position.x = center.x;
        mesh.position.y = center.y;
        mesh.position.z = center.z;
      }
    }

    updateClippingPlane();
  
  }
  else{
    console.log("No Model has been loaded");
  }
}

// //Set Up Clipping Planes
// function setUpClippingPlanes(dir,ifcModel){

//   const x = new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 0 );
//   const y = new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0 );
//   const z = new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 0 );
  
//   const helpers = new THREE.Group();
//   helpers.add( new THREE.PlaneHelper( clipPlanes[ 0 ], 50 , 0xff0000 ) );
//   helpers.add( new THREE.PlaneHelper( clipPlanes[ 1 ], 50 , 0x00ff00 ) );
//   helpers.add( new THREE.PlaneHelper( clipPlanes[ 2 ], 50 , 0x0000ff ) );
//   helpers.visible = true;
//   scene.add( helpers );
  

// }


//    // Initialize TransformControls
//   const transformControls = new TransformControls(camera, renderer.domElement);
//   transformControls.attach(ifcLoadedModel[0]);

//   transformControls.addEventListener('mouseDown', () => {
//     controls.enabled = false; // Disable orbit controls
//   });
  
//   // Event listener for mouseUp event on TransformControls
//   transformControls.addEventListener('mouseUp', () => {
//     controls.enabled = true; // Re-enable orbit controls
//   });

//   scene.add(transformControls);
// // Toggle button for clipping
// var toggleClipButton = document.getElementById('rulerBtn');
// toggleClipButton.addEventListener('click', function () {
//     clipEnabled = !clipEnabled;
//     applyClipping();
// });





// //Set Up Ray Casting
// const raycaster = new Raycaster();
// raycaster.firstHitOnly = true;
// const mouse = new Vector2();

// function cast(event) {
//   // Computes the position of the mouse on the screen
//   const bounds = threeCanvas.getBoundingClientRect();

//   const x1 = event.clientX - bounds.left;
//   const x2 = bounds.right - bounds.left;
//   mouse.x = (x1 / x2) * 2 - 1;

//   const y1 = event.clientY - bounds.top;
//   const y2 = bounds.bottom - bounds.top;
//   mouse.y = -(y1 / y2) * 2 + 1;

//   // Places it on the camera pointing to the mouse
//   raycaster.setFromCamera(mouse, camera);

//   // Casts a ray
//   return raycaster.intersectObjects(ifcLoadedModel);
// }

// //Highlist when hover
// //Creates subset material
// const preselectMat = new MeshLambertMaterial({
//   transparent: true,
//   opacity: 0.6,
//   color: 0xff88ff,
//   depthTest: false,
// });

// // Event that gets executed when an item is picked
// async function pick(event) {
//   const found = cast(event)[0];
//   if (found) {
//     const index = found.faceIndex;
//     const geometry = found.object.geometry;
//     const ifc = ifcLoader.ifcManager;
//     const id = ifc.getExpressId(geometry, index);
//     console.log(id);
//   }
// }
// threeCanvas.ondblclick = pick;
// function highlight(event, material, model) {
//   const found = cast(event)[0];
//   if (found) {
//     // Gets model ID
//     modelID = found.object.modelID;

//     // Gets Express ID
//     const index = found.faceIndex;
//     const geometry = found.object.geometry;
//     const id = ifc.getExpressId(geometry, index);
//     const props = ifc.getItemProperties(modelID, id);
//     console.log("props",props,"id",id,'index',index )

//     // Creates subset
//     ifcLoader.ifcManager.createSubset({
//       modelID: model.id,
//       ids: [id],
//       material: material,
//       scene: scene,
//       removePrevious: true,
//     });
//   } else {
//     // Removes previous highlight
//     ifc.removeSubset(model.id, material);
//   }
// }

// window.onmousedown = (event) => highlight(event, preselectMat, ifcLoadedModel);



/* // Create a function for the Raycaster to cast rays, calculating the position of the mouse on the screen


async function pick(event) {
  const found = cast(event)[0];
  if (found) {
    const index = found.faceIndex;
    const geometry = found.object.geometry;
    const ifc = ifcLoader.ifcManager;
    const id = ifc.getExpressId(geometry, index);
    const modelID = found.object.modelID;
    const props = await ifc.getItemProperties(modelID, id);
    const type = await ifc.getIfcType(modelID, id);
    const material = await ifc.getMaterialsProperties(modelID, id);
    document.getElementsByClassName("output")[0].innerHTML = `modelID = ${modelID} <br> id = ${id} <br> type = ${type} <br> material = ${material}`;
    console.log(JSON.stringify(props, null, 2));
    console.log(modelID);
    console.log(id);
    console.log(geometry);
    console.log(type);
    console.log(material);
  }
}

threeCanvas.ondblclick = pick;

// Creates subset material
const preselectMat = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.6,
  color: 0xff88ff,
  depthTest: false,
});

// Create highlight effect
const ifc = ifcLoader.ifcManager;

// Reference to the previous selection
let preselectModel = { id: -1 };

function highlight(event, material, model) {
  const found = cast(event)[0];
  if (found) {
    // Gets model ID
    model.id = found.object.modelID;

    // Gets Express ID
    const index = found.faceIndex;
    const geometry = found.object.geometry;
    const id = ifc.getExpressId(geometry, index);

    // Creates subset
    ifcLoader.ifcManager.createSubset({
      modelID: model.id,
      ids: [id],
      material: material,
      scene: scene,
      removePrevious: true,
    });
  } else {
    // Removes previous highlight
    ifc.removeSubset(model.id, material);
  }
}

window.onmousemove = (event) => highlight(event, preselectMat, preselectModel);

// List of categories names
const categories = {
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCFURNISHINGELEMENT,
  IFCDOOR,
  IFCWINDOW,
  IFCPLATE,
  IFCMEMBER,
}

// Gets the name of a category
function getName(category) {
  const names = Object.keys(categories);
  return names.find((name) => categories[name] === category);
}

// Gets the IDs of all the items of a specific category
async function getAll(category) {
  const manager = ifcLoader.ifcManager;
  return manager.getAllItemsOfType(0, category, false);
}

// Creates a new subset containing all elements of a category
async function newSubsetOfType(category) {
  const ids = await getAll(category);
  return ifcLoader.ifcManager.createSubset({
    modelID: 0,
    scene,
    ids,
    removePrevious: true,
    customID: category.toString(),
  });
}

// Stores the created subsets
const subsets = {};

async function setupAllCategories() {
  const allCategories = Object.values(categories);
  for (let i = 0; i < allCategories.length; i++) {
    const category = allCategories[i];
    await setupCategory(category);
  }
}

// Creates a new subset and configures the checkbox
async function setupCategory(category) {
  subsets[category] = await newSubsetOfType(category);
  setupCheckBox(category);
}

// Sets up the checkbox event to hide / show elements
function setupCheckBox(category) {
  const name = getName(category);
  const checkBox = document.getElementById(name);
  checkBox.addEventListener("change", (event) => {
    console.log("This informatio  +" + name);
    const checked = event.target.checked;
    const subset = subsets[category];
    if (checked) scene.add(subset);
    else subset.removeFromParent();
  });
}

 */
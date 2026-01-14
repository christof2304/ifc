import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import './style.css';

// ============================================
// APP STATE
// ============================================
interface AppState {
    components: OBC.Components | null;
    world: OBC.World | null;
    fragments: OBC.FragmentsManager | null;
    ifcLoader: OBC.IfcLoader | null;
    highlighter: OBCF.Highlighter | null;
    currentModel: any;
}

const state: AppState = {
    components: null,
    world: null,
    fragments: null,
    ifcLoader: null,
    highlighter: null,
    currentModel: null
};

// ============================================
// DOM ELEMENTS
// ============================================
const viewport = document.getElementById('viewport')!;
const dropzone = document.getElementById('dropzone')!;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const btnLoad = document.getElementById('btn-load')!;
const btnFit = document.getElementById('btn-fit')!;
const btnReset = document.getElementById('btn-reset')!;
const statusEl = document.getElementById('status')!;
const propertiesEl = document.getElementById('properties')!;

// ============================================
// STATUS HELPER
// ============================================
function setStatus(text: string, type: string = '') {
    statusEl.textContent = text;
    statusEl.className = 'status ' + type;
}

// ============================================
// INIT ENGINE
// ============================================
async function initEngine() {
    setStatus('Engine initialisieren...', 'loading');
    
    // Components initialisieren
    state.components = new OBC.Components();
    
    // World erstellen
    const worlds = state.components.get(OBC.Worlds);
    state.world = worlds.create<
        OBC.SimpleScene,
        OBC.SimpleCamera,
        OBC.SimpleRenderer
    >();
    
    // Scene
    state.world.scene = new OBC.SimpleScene(state.components);
    state.world.scene.setup();
    state.world.scene.three.background = new THREE.Color(0x0a0a0b);
    
    // Renderer
    state.world.renderer = new OBC.SimpleRenderer(state.components, viewport);
    
    // Camera
    state.world.camera = new OBC.SimpleCamera(state.components);
    await state.world.camera.controls.setLookAt(15, 15, 15, 0, 0, 0);
    
    // Engine starten
    state.components.init();
    
    // FragmentsManager initialisieren
    const workerUrl = 'https://thatopen.github.io/engine_fragment/resources/worker.mjs';
    state.fragments = state.components.get(OBC.FragmentsManager);
    state.fragments.init(workerUrl);
    
    // Model zur Szene hinzufügen wenn geladen
    state.fragments.list.onItemSet.add(({ value: model }) => {
        model.useCamera(state.world!.camera.three);
        state.world!.scene.three.add(model.object);
        state.fragments!.core.update(true);
        state.currentModel = model;
    });
    
    // Camera update bei Bewegung
    state.world.camera.controls.addEventListener('rest', () => {
        state.fragments?.core.update(true);
    });
    
    // IFC Loader konfigurieren
    state.ifcLoader = state.components.get(OBC.IfcLoader);
    await state.ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
            path: 'https://unpkg.com/web-ifc@0.0.72/',
            absolute: true
        }
    });
    
    // Highlighter für Selektion (Frontend-Komponente)
    try {
        state.highlighter = state.components.get(OBCF.Highlighter);
        state.highlighter.setup({ world: state.world });
        
        // Selection Event
        state.highlighter.events.select.onHighlight.add((fragmentIdMap) => {
            showProperties(fragmentIdMap);
        });
        
        state.highlighter.events.select.onClear.add(() => {
            clearProperties();
        });
    } catch (e) {
        console.warn('Highlighter nicht verfügbar:', e);
    }
    
    // Raycaster für Klick-Events
    const raycasters = state.components.get(OBC.Raycasters);
    raycasters.get(state.world);
    
    setStatus('Bereit', 'ready');
}

// ============================================
// LOAD IFC FILE
// ============================================
async function loadIFC(file: File) {
    setStatus('IFC wird geladen...', 'loading');
    dropzone.classList.add('hidden');
    
    try {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        
        // Altes Model entfernen falls vorhanden
        if (state.currentModel && state.world) {
            state.world.scene.three.remove(state.currentModel.object);
        }
        
        // IFC laden
        await state.ifcLoader!.load(data);
        
        // Kamera anpassen
        fitCamera();
        
        setStatus(`${file.name} geladen`, 'ready');
        
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        setStatus('Fehler: ' + (error as Error).message, '');
        dropzone.classList.remove('hidden');
    }
}

// ============================================
// CAMERA CONTROLS
// ============================================
function fitCamera() {
    if (!state.currentModel || !state.world) return;
    
    const box = new THREE.Box3().setFromObject(state.currentModel.object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;
    
    (state.world.camera as OBC.SimpleCamera).controls.setLookAt(
        center.x + distance,
        center.y + distance * 0.7,
        center.z + distance,
        center.x,
        center.y,
        center.z,
        true
    );
}

function resetCamera() {
    if (!state.world) return;
    (state.world.camera as OBC.SimpleCamera).controls.setLookAt(15, 15, 15, 0, 0, 0, true);
}

// ============================================
// PROPERTIES PANEL
// ============================================
async function showProperties(fragmentIdMap: any) {
    if (!fragmentIdMap || Object.keys(fragmentIdMap).length === 0) {
        clearProperties();
        return;
    }
    
    // Erste Fragment-ID und Express-ID extrahieren
    const fragmentId = Object.keys(fragmentIdMap)[0];
    const expressIds = fragmentIdMap[fragmentId];
    
    if (!expressIds || expressIds.size === 0) {
        clearProperties();
        return;
    }
    
    const expressId = [...expressIds][0];
    
    // Properties HTML erstellen
    const html = `
        <div class="property-group">
            <div class="property-group-title">Identifikation</div>
            <div class="property-row">
                <span class="property-key">Express ID</span>
                <span class="property-value">${expressId}</span>
            </div>
            <div class="property-row">
                <span class="property-key">Fragment ID</span>
                <span class="property-value">${fragmentId.substring(0, 12)}...</span>
            </div>
        </div>
        <div class="property-group">
            <div class="property-group-title">Hinweis</div>
            <div class="property-row">
                <span class="property-key" style="max-width: 100%">
                    Für vollständige IFC-Properties wird der IfcPropertiesManager benötigt.
                </span>
            </div>
        </div>
    `;
    
    propertiesEl.innerHTML = html;
}

function clearProperties() {
    propertiesEl.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <p>Element im Viewer auswählen<br>um Eigenschaften zu sehen</p>
        </div>
    `;
}

// ============================================
// EVENT HANDLERS
// ============================================

// File Input
btnLoad.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadIFC(file);
});

// Buttons
btnFit.addEventListener('click', fitCamera);
btnReset.addEventListener('click', resetCamera);

// Drag & Drop
viewport.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

viewport.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    
    const file = e.dataTransfer?.files[0];
    if (file && file.name.toLowerCase().endsWith('.ifc')) {
        loadIFC(file);
    } else {
        setStatus('Bitte eine .ifc Datei laden', '');
    }
});

// ============================================
// STARTUP
// ============================================
initEngine().catch(err => {
    console.error('Init Error:', err);
    setStatus('Engine-Fehler: ' + err.message, '');
    
    // Show helpful message in dropzone
    dropzone.innerHTML = `
        <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
        </svg>
        <h2 style="color: #ef4444;">Ladefehler</h2>
        <p style="max-width: 300px; line-height: 1.5;">
            ${err.message}<br><br>
            Bitte überprüfe die Browser-Konsole für Details.
        </p>
    `;
});

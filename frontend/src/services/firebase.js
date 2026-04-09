import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBSRune1QkHEZINI5mCJLBwdrXBH5kZ92g",
  authDomain: "projet-app-transport.firebaseapp.com",
  projectId: "projet-app-transport",
  storageBucket: "projet-app-transport.firebasestorage.app",
  messagingSenderId: "336825017557",
  appId: "1:336825017557:web:06a3b5dfd42adbc2856e5c",
  measurementId: "G-FLBPZ41LTC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics (optional, only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// ==================== MISSIONS (Deliveries) FIRESTORE SERVICE ====================

const MISSIONS_COLLECTION = 'missions';
const DRIVERS_COLLECTION = 'chauffeurs';

export const firestoreMissions = {
  // Get all missions
  getAll: async (filters = {}) => {
    try {
      let q = collection(db, MISSIONS_COLLECTION);
      
      // Apply filters if provided
      const constraints = [];
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.driver_id) {
        constraints.push(where('driver_id', '==', filters.driver_id));
      }
      if (filters.client_id) {
        constraints.push(where('client_id', '==', filters.client_id));
      }
      
      constraints.push(orderBy('created_at', 'desc'));
      
      if (constraints.length > 0) {
        q = query(collection(db, MISSIONS_COLLECTION), ...constraints);
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Firestore getAll error:', error);
      throw error;
    }
  },

  // Get single mission by tracking ID
  getByTrackingId: async (trackingId) => {
    try {
      const q = query(
        collection(db, MISSIONS_COLLECTION),
        where('tracking_id', '==', trackingId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Firestore getByTrackingId error:', error);
      throw error;
    }
  },

  // Create new mission
  create: async (missionData) => {
    try {
      const docRef = await addDoc(collection(db, MISSIONS_COLLECTION), {
        ...missionData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      return { id: docRef.id, ...missionData };
    } catch (error) {
      console.error('Firestore create error:', error);
      throw error;
    }
  },

  // Update mission
  update: async (trackingId, updateData) => {
    try {
      // Find document by tracking_id
      const q = query(
        collection(db, MISSIONS_COLLECTION),
        where('tracking_id', '==', trackingId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Mission not found');
      }
      
      const docRef = doc(db, MISSIONS_COLLECTION, snapshot.docs[0].id);
      await updateDoc(docRef, {
        ...updateData,
        updated_at: serverTimestamp()
      });
      
      return { tracking_id: trackingId, ...updateData };
    } catch (error) {
      console.error('Firestore update error:', error);
      throw error;
    }
  },

  // Delete mission
  delete: async (trackingId) => {
    try {
      const q = query(
        collection(db, MISSIONS_COLLECTION),
        where('tracking_id', '==', trackingId)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        await deleteDoc(doc(db, MISSIONS_COLLECTION, snapshot.docs[0].id));
      }
      
      return { deleted: true };
    } catch (error) {
      console.error('Firestore delete error:', error);
      throw error;
    }
  },

  // Subscribe to real-time updates
  subscribe: (filters = {}, callback) => {
    let q = collection(db, MISSIONS_COLLECTION);
    
    const constraints = [];
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.driver_id) {
      constraints.push(where('driver_id', '==', filters.driver_id));
    }
    if (filters.client_id) {
      constraints.push(where('client_id', '==', filters.client_id));
    }
    
    if (constraints.length > 0) {
      q = query(collection(db, MISSIONS_COLLECTION), ...constraints);
    }
    
    // Return unsubscribe function
    return onSnapshot(q, (snapshot) => {
      const missions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(missions);
    }, (error) => {
      console.error('Firestore subscription error:', error);
    });
  },

  // Assign driver to mission
  assignDriver: async (trackingId, driverId, driverName) => {
    return firestoreMissions.update(trackingId, {
      driver_id: driverId,
      driver_name: driverName,
      status: 'assigned'
    });
  },

  // Start delivery
  startDelivery: async (trackingId) => {
    return firestoreMissions.update(trackingId, {
      status: 'in_transit',
      started_at: new Date().toISOString()
    });
  },

  // Complete delivery
  completeDelivery: async (trackingId, signatureData) => {
    return firestoreMissions.update(trackingId, {
      status: 'delivered',
      signature_data: signatureData,
      delivered_at: new Date().toISOString()
    });
  }
};

// ==================== CHAUFFEURS (Drivers) FIRESTORE SERVICE ====================

export const firestoreDrivers = {
  // Get all drivers from Firestore
  getAll: async () => {
    try {
      const q = query(collection(db, DRIVERS_COLLECTION), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Firestore getAll drivers error:', error);
      return [];
    }
  },

  // Create a new driver
  create: async (driverData) => {
    try {
      const docRef = await addDoc(collection(db, DRIVERS_COLLECTION), {
        ...driverData,
        status: 'active',
        created_at: serverTimestamp()
      });
      return { id: docRef.id, ...driverData };
    } catch (error) {
      console.error('Firestore create driver error:', error);
      throw error;
    }
  },

  // Subscribe to real-time driver updates
  subscribe: (callback) => {
    const q = query(collection(db, DRIVERS_COLLECTION), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const drivers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(drivers);
    }, (error) => {
      console.error('Firestore drivers subscription error:', error);
    });
  }
};

// Export Firebase instances
export { app, db, analytics };
export default firestoreMissions;

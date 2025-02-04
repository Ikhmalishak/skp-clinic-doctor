import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Diagnosis-Medicines.css";

function DiagnosisMedicines() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [newMedicine, setNewMedicine] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Diagnoses
  const fetchDiagnoses = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/diagnoses');
      setDiagnoses(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch diagnoses');
      console.error('Error fetching diagnoses:', err);
    }
  };

  // Fetch Medicines
  const fetchMedicines = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/medicines');
      setMedicines(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch medicines');
      console.error('Error fetching medicines:', err);
    }
  };

  // Add Medicine
  const addMedicine = async () => {
    if (!newMedicine.trim()) return;
    
    try {
      setLoading(true);
      await axios.post('http://127.0.0.1:8000/api/medicines', {
        name: newMedicine
      });
      setNewMedicine("");
      fetchMedicines();
      setError(null);
    } catch (err) {
      setError('Failed to add medicine');
      console.error('Error adding medicine:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add Diagnosis
  const addDiagnosis = async () => {
    if (!newDiagnosis.trim()) return;

    try {
      setLoading(true);
      await axios.post('http://127.0.0.1:8000/api/diagnoses', {
        name: newDiagnosis
      });
      setNewDiagnosis("");
      fetchDiagnoses();
      setError(null);
    } catch (err) {
      setError('Failed to add diagnosis');
      console.error('Error adding diagnosis:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update Medicine
  const updateMedicine = async (id, name) => {
    try {
      setLoading(true);
      await axios.put(`http://127.0.0.1:8000/api/medicines/${id}`, {
        name: name
      });
      fetchMedicines();
      setError(null);
    } catch (err) {
      setError('Failed to update medicine');
      console.error('Error updating medicine:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update Diagnosis
  const updateDiagnosis = async (id, name) => {
    try {
      setLoading(true);
      await axios.put(`http://127.0.0.1:8000/api/diagnoses/${id}`, {
        name: name
      });
      fetchDiagnoses();
      setError(null);
    } catch (err) {
      setError('Failed to update diagnosis');
      console.error('Error updating diagnosis:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Medicine
  const deleteMedicine = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`http://127.0.0.1:8000/api/medicines/${id}`);
      fetchMedicines();
      setError(null);
    } catch (err) {
      setError('Failed to delete medicine');
      console.error('Error deleting medicine:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Diagnosis
  const deleteDiagnosis = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`http://127.0.0.1:8000/api/diagnoses/${id}`);
      fetchDiagnoses();
      setError(null);
    } catch (err) {
      setError('Failed to delete diagnosis');
      console.error('Error deleting diagnosis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchDiagnoses();
  }, []);

  return (
    <div className="diag-med">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="manage-container">
        {/* Diagnoses Section */}
        <div className="manage-section">
          <h1>Manage Diagnoses</h1>
          <div>
            <input
              type="text"
              placeholder="New Diagnosis"
              value={newDiagnosis}
              onChange={(e) => setNewDiagnosis(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={addDiagnosis}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Diagnosis'}
            </button>
          </div>
          <ul className="manage-list">
            {diagnoses.map((diagnosis) => (
              <li key={diagnosis.id}>
                <input
                  type="text"
                  value={diagnosis.name}
                  onChange={(e) => updateDiagnosis(diagnosis.id, e.target.value)}
                  disabled={loading}
                />
                <button 
                  onClick={() => deleteDiagnosis(diagnosis.id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Medicines Section */}
        <div className="manage-section">
          <h1>Manage Medicines</h1>
          <div>
            <input
              type="text"
              placeholder="New Medicine"
              value={newMedicine}
              onChange={(e) => setNewMedicine(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={addMedicine}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Medicine'}
            </button>
          </div>
          <ul className="manage-list">
            {medicines.map((medicine) => (
              <li key={medicine.id}>
                <input
                  type="text"
                  value={medicine.name}
                  onChange={(e) => updateMedicine(medicine.id, e.target.value)}
                  disabled={loading}
                />
                <button 
                  onClick={() => deleteMedicine(medicine.id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DiagnosisMedicines;
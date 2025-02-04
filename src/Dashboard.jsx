import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api"; // Laravel API Base URL

const DoctorDashboard = () => {
  const [tableData, setTableData] = useState([]);
  const [stats, setStats] = useState({
    newPatients: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    avgWaitingTime: "0 min",
  });

  // Popup and Consultation Form State
  const [popupPatient, setPopupPatient] = useState(null);
  const [diagnoses, setDiagnoses] = useState([{ name: "" }]);
  const [medicines, setMedicines] = useState([{ name: "", dosage: "" }]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [mcYes, setMcYes] = useState(false);
  const [mcDates, setMcDates] = useState({ start: "", end: "" });
  const [mcAmount, setMcAmount] = useState("");
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState([]);
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null); // Store the current patient being called
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingRepeat, setLoadingRepeat] = useState(false);
  const [disableCallNext, setDisableCallNext] = useState(false); // Disable Call Next button


  useEffect(() => {
    fetchPatients();
    fetchStats();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/patientlist`);
      console.log("Raw API Response:", response.data);

      const formattedData = response.data.map((item) => ({
        id: item.id,
        queueNo: item.queue_number,
        name: item.employee ? item.employee.name : "N/A",
        empId: item.employee ? item.employee.employee_id : "N/A",
        gender: item.employee ? item.employee.gender : "N/A",
        age: item.employee && item.employee.dob ? calculateAge(item.employee.dob) : "N/A",
        status: item.status,
        timeIn: item.patient_in_time,
        timeOut: item.patient_out_time
      }));

      console.log("Formatted Data:", formattedData);
      setTableData(formattedData);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };
  const announceQueueNumber = (queueNumber) => {
    if ("speechSynthesis" in window) {
      // Format the queue number as "zero zero seven"
      const formattedQueueNumber = queueNumber
        .toString()
        .split("")
        .map((digit) => (digit === "0" ? "zero" : digit))
        .join(" ");

      // Play "ding dong" sound
      const audio = new Audio('/sounds/minimalist-ding-dong.wav');
      audio.play();

      // Wait for the sound to finish before speaking
      audio.onended = () => {
        // English announcement
        const englishUtterance = new SpeechSynthesisUtterance(`Now serving ${formattedQueueNumber}`);
        englishUtterance.lang = "en-US";
        englishUtterance.rate = 0.8; // Adjusted rate for better clarity

        // Malay announcement
        const malayUtterance = new SpeechSynthesisUtterance(`Sekarang nombor ${formattedQueueNumber}`);
        malayUtterance.lang = "ms-MY";
        malayUtterance.rate = 0.8; // Adjusted rate for better clarity

        // Queue announcements
        window.speechSynthesis.speak(englishUtterance);
        window.speechSynthesis.speak(malayUtterance);
      };
    }
  };

  const callNextPatient = async () => {
    setLoadingNext(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/patients/next`);

      if (response.data.success && response.data.data.length > 0) {
        const nextPatient = response.data.data[0];
        setCurrentPatient(nextPatient);
        setDisableCallNext(false);

        // Announce queue number
        announceQueueNumber(nextPatient.queue_number);

        alert(`Next patient called: (Queue No: ${nextPatient.queue_number})`);

        await fetchPatients(); // Refresh the patient list
      } else {
        alert("No patients waiting in the queue.");
      }
    } catch (error) {
      console.error("Error calling next patient:", error);
      alert("Failed to call the next patient. Please try again.");
    } finally {
      setLoadingNext(false);
    }
  };

  const repeatCall = () => {
    if (!currentPatient) {
      alert("No current patient to repeat the call for.");
      return;
    }
    setLoadingRepeat(true);

    // Announce queue number again
    announceQueueNumber(currentPatient.queue_number);

    setTimeout(() => {
      alert(`Repeated call for patient: (Queue No: ${currentPatient.queue_number})`);
      setLoadingRepeat(false);
    }, 1000); // Simulate a delay for the repeat call
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    return today.getFullYear() - birthDate.getFullYear();
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/queuedashboard`);
      setStats({
        newPatients: response.data.counts?.totalpatient?.length || 0,
        completedAppointments: response.data.counts?.completed || 0,
        pendingAppointments: response.data.counts?.waiting || 0,
        avgWaitingTime: response.data.counts?.avgWaitTime || "0 min",
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleTimeIn = async (patient) => {
    try {
      await axios.put(`${API_BASE_URL}/patients/${patient.id}/timein`);
      await refreshData(); // Unified function to refresh both patients and stats
      setDisableCallNext(true);
      alert("Time In recorded successfully!");
    } catch (error) {
      console.error("Error updating Time In:", error);
      const errorMessage =
        error.response && error.response.data && error.response.data.error
          ? error.response.data.error
          : "Failed to update Time In. Please try again.";
      alert(errorMessage);
    }
  };

  const handleTimeOut = async (patient) => {
    try {
      await axios.put(`${API_BASE_URL}/patients/${patient.id}/timeout`);
      await refreshData(); // Unified function to refresh both patients and stats
      setDisableCallNext(false);
      alert("Time Out recorded successfully!");
    } catch (error) {
      console.error("Error updating Time Out:", error);
      const errorMessage =
        error.response && error.response.data && error.response.data.error
          ? error.response.data.error
          : "Failed to update Time Out. Please try again.";
      alert(errorMessage);
    }
  };


  // Refresh both patients and stats
  const refreshData = async () => {
    await fetchPatients();
    await fetchStats();
  };

  const updateStatus = async (patient, statusType) => {
    try {
      await axios.put(`${API_BASE_URL}/patients/${patient.id}/complete`);
      setTableData((prevData) =>
        prevData.map((item) =>
          item.id === patient.id ? { ...item, status: statusType === "complete" ? "Completed" : item.status } : item
        )
      );
      fetchStats();
    } catch (error) {
      console.error(`Error updating ${statusType} for patient:`, error);
      alert(`Failed to update ${statusType}. Please try again.`);
    }
  };

  // Popup and Consultation Form Handlers
  const openPopup = (patient) => {
    setPopupPatient(patient);
  };

  const closePopup = () => {
    setPopupPatient(null);
    resetForm();
  };

  const resetForm = () => {
    setDiagnoses([{ name: "" }]);
    setMedicines([{ name: "", dosage: "" }]);
    setAdditionalNotes("");
    setMcYes(false);
    setMcDates({ start: "", end: "" });
    setMcAmount("");
  };

  const handleAddDiagnosis = () => {
    setDiagnoses([...diagnoses, { name: "" }]);
  };

  const handleRemoveDiagnosis = (index) => {
    const newDiagnoses = diagnoses.filter((_, i) => i !== index);
    setDiagnoses(newDiagnoses);
  };

  const handleDiagnosisChange = (index, value) => {
    const newDiagnoses = [...diagnoses];
    newDiagnoses[index].name = value;
    setDiagnoses(newDiagnoses);
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "" }]);
  };

  const handleRemoveMedicine = (index) => {
    const newMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(newMedicines);
  };

  const handleMedicineChange = (index, field, value) => {
    const newMedicines = [...medicines];
    newMedicines[index][field] = value;
    setMedicines(newMedicines);
  };

  const handleSave = async () => {
    try {
      const consultationData = {
        consultation_details: JSON.stringify(diagnoses.map((d) => d.name).filter(Boolean)), // Convert diagnoses to JSON
        prescribed_medicine: JSON.stringify(
          medicines.map((m) => ({
            name: m.name,
            dosage: m.dosage,
          })).filter((m) => m.name)
        ), // Convert medicines to JSON
        mc_issued: mcYes ? 1 : 0, // 1 if MC issued, otherwise 0
      };

      // Send PUT request to update the queue entry
      await axios.put(`${API_BASE_URL}/queue/${popupPatient.id}`, consultationData);

      alert("Consultation saved successfully!");
      closePopup();
    } catch (error) {
      console.error("Error saving consultation:", error);
      alert("Failed to save consultation. Please try again.");
    }
  };

  const fetchDiagnosisSuggestions = async (query) => {
    if (query.length > 0) {
      try {
        const response = await axios.get(`${API_BASE_URL}/diagnosis-suggestions`, {
          params: { query }, // Pass the query parameter
        });
        setDiagnosisSuggestions(response.data); // Set the list of suggestions
      } catch (error) {
        console.error("Error fetching diagnosis suggestions:", error);
      }
    } else {
      setDiagnosisSuggestions([]); // Clear suggestions if input is empty
    }
  };

  const fetchMedicineSuggestions = async (query) => {
    if (query.length > 0) {
      try {
        const response = await axios.get(`${API_BASE_URL}/medicine-suggestions`, {
          params: { query }, // Pass the query parameter
        });
        setMedicineSuggestions(response.data); // Set the list of suggestions
      } catch (error) {
        console.error("Error fetching medicine suggestions:", error);
      }
    } else {
      setMedicineSuggestions([]); // Clear suggestions if input is empty
    }
  };

  return (
    <div className="content-wrapper" style={{ marginLeft: "0", paddingLeft: "0" }}>
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0" style={{ marginBottom: "20px" }}>
            Welcome to SKP Clinic Doctor
          </h1>
        </div>
      </div>
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            {["New Patients", "Completed", "Waiting", "Average Waiting Time"].map((label, index) => {
              const statKeys = ["newPatients", "completedAppointments", "pendingAppointments", "avgWaitingTime"];
              const colors = ["info", "success", "warning", "secondary"];
              return (
                <div key={index} className="col-lg-3 col-6">
                  <div className={`small-box bg-${colors[index]}`}>
                    <div className="inner">
                      <h3>{stats[statKeys[index]]}</h3>
                      <p>{label}</p>
                    </div>
                    <div className="icon">
                      <i className={`fas ${index === 0 ? "fa-user-plus" : index === 1 ? "fa-check-circle" : index === 2 ? "fa-clock" : "fa-hourglass-half"}`}></i>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h3 className="card-title" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                    Patient List
                  </h3>
                  <div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={callNextPatient}
                      disabled={loadingNext || disableCallNext} // ✅ Correct condition
                    >
                      {loadingNext ? "Calling..." : "Call Next Patient"}
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={repeatCall}
                      disabled={loadingRepeat}
                    >
                      {loadingRepeat ? "Repeating..." : "Repeat Call"}
                    </button>
                  </div>
                </div>
                <div className="card-body table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Queue No.</th>
                        <th>Name</th>
                        <th>Emp ID</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Status</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.length > 0 ? (
                        tableData.map((row) => (
                          <tr key={row.id}>
                            <td>{row.queueNo}</td>
                            <td>{row.name}</td>
                            <td>{row.empId}</td>
                            <td>{row.gender}</td>
                            <td>{row.age}</td>
                            <td>{row.status}</td>
                            <td>{row.timeIn}</td>
                            <td>{row.timeOut}</td>
                            <td>
                              <button className="btn btn-primary btn-sm mr-2" onClick={() => handleTimeIn(row)}>
                                Time In
                              </button>
                              <button className="btn btn-danger btn-sm mr-2" onClick={() => handleTimeOut(row)}>
                                Time Out
                              </button>
                              <button className="btn btn-info btn-sm" onClick={() => openPopup(row)}>
                                Consult
                              </button>
                              {row.status !== "Completed" && (
                                <button className="btn btn-success btn-sm ml-2" onClick={() => updateStatus(row, "complete")}>
                                  ✓
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center" }}>No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popup Window */}
      {popupPatient && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Consultation</h3>
            <p>
              You are consulting with: <strong>{popupPatient.name}</strong>
            </p>

            {/* Diagnosis */}
            <div className="form-group">
              <label>Diagnosis:</label>
              {diagnoses.map((diag, index) => (
                <div key={index} className="d-flex mb-2 position-relative">
                  <div style={{ width: "100%", position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Diagnosis Name"
                      value={diag.name}
                      onChange={(e) => {
                        handleDiagnosisChange(index, e.target.value);
                        fetchDiagnosisSuggestions(e.target.value); // Fetch suggestions
                      }}
                      className="form-control"
                    />
                    {/* Render suggestions */}
                    {diagnosisSuggestions.length > 0 && (
                      <div className="suggestions">
                        {diagnosisSuggestions.map((suggestion, i) => (
                          <div
                            key={i}
                            className="suggestion-item"
                            onClick={() => {
                              handleDiagnosisChange(index, suggestion);
                              setDiagnosisSuggestions([]);
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveDiagnosis(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleAddDiagnosis}
              >
                Add Diagnosis
              </button>
            </div>

            {/* Medicines */}
            <div className="form-group">
              <label>Medicines:</label>
              {medicines.map((med, index) => (
                <div key={index} className="d-flex mb-2 position-relative">
                  <div style={{ width: "100%", position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      value={med.name}
                      onChange={(e) => {
                        handleMedicineChange(index, "name", e.target.value);
                        fetchMedicineSuggestions(e.target.value); // Fetch suggestions
                      }}
                      className="form-control"
                    />
                    {/* Render suggestions */}
                    {medicineSuggestions.length > 0 && (
                      <div className="suggestions">
                        {medicineSuggestions.map((suggestion, i) => (
                          <div
                            key={i}
                            className="suggestion-item"
                            onClick={() => {
                              handleMedicineChange(index, "name", suggestion);
                              setMedicineSuggestions([]);
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Dosage */}
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) =>
                      handleMedicineChange(index, "dosage", e.target.value)
                    }
                    className="form-control mr-2"
                  />
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveMedicine(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleAddMedicine}
              >
                Add Medicine
              </button>
            </div>

            {/* Additional Notes */}
            <div className="form-group">
              <label>Additional Notes:</label>
              <textarea
                rows="3"
                className="form-control"
                placeholder="Enter any notes here..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>

            {/* MC */}
            <div className="form-group">
              <label>MC:</label>
              <div>
                <button
                  className={`btn ${mcYes ? "btn-success" : "btn-light"} mr-2`}
                  onClick={() => setMcYes(true)}
                >
                  Yes
                </button>
                <button
                  className={`btn ${!mcYes ? "btn-success" : "btn-light"}`}
                  onClick={() => setMcYes(false)}
                >
                  No
                </button>
              </div>
            </div>

            {/* MC Dates */}
            {mcYes && (
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={mcDates.start}
                  onChange={(e) =>
                    setMcDates((prev) => ({ ...prev, start: e.target.value }))
                  }
                />
                <label>End Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={mcDates.end}
                  onChange={(e) =>
                    setMcDates((prev) => ({ ...prev, end: e.target.value }))
                  }
                />
              </div>
            )}

            {/* Amount */}
            <div className="form-group">
              <label>Amount:</label>
              <input
                type="number"
                className="form-control"
                value={mcAmount}
                onChange={(e) => setMcAmount(e.target.value)}
              />
            </div>

            {/* Save and Close Buttons */}
            <button className="btn btn-primary mt-3" onClick={handleSave}>
              Save
            </button>
            <button className="btn btn-secondary mt-3 ml-2" onClick={closePopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
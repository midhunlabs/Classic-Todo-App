import React, { useState, useEffect } from 'react';
import './index.css';
import { db, auth } from './firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './Login';
import SpecialPage from './SpecialPage';

function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const getTodayDateString = () => new Date().toDateString();
  const [currentDate, setCurrentDate] = useState(getTodayDateString());
  const [todos, setTodos] = useState([]);

  const changeDate = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toDateString());
  };
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [padTitle, setPadTitle] = useState('My Tasks');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasSeenSpecial, setHasSeenSpecial] = useState(false);

  // Authentication & Migration
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthChecking(false);
      
      // Data Migration
      if (u && u.email === 'harikrishnanr948@gmail.com') {
        try {
          // Migrate Tasks
          const tasksRef = collection(db, 'tasks');
          const tasksSnap = await getDocs(tasksRef);
          const batch = writeBatch(db);
          let changesCount = 0;
          tasksSnap.forEach((d) => {
            if (!d.data().userId) {
              batch.update(d.ref, { userId: u.uid });
              changesCount++;
            }
          });
          if (changesCount > 0) {
            await batch.commit();
            console.log(`Migrated ${changesCount} tasks to harikrishnanr948@gmail.com`);
          }

          // Migrate pad_meta
          const padsSnap = await getDocs(collection(db, 'pad_meta'));
          const padBatch = writeBatch(db);
          let padChanges = 0;
          padsSnap.forEach((d) => {
            if (!d.data().userId) {
              const userPadRef = doc(db, 'users', u.uid, 'pad_meta', d.id);
              padBatch.set(userPadRef, { ...d.data(), userId: u.uid });
              padChanges++;
            }
          });
          if (padChanges > 0) {
            await padBatch.commit();
            console.log(`Migrated ${padChanges} pad_meta titles to harikrishnanr948@gmail.com`);
          }
        } catch(e) { console.error("Migration error:", e); }
      }
    });
    return () => unsub();
  }, []);

  // Persist pad title in Firebase per date, specific to user
  useEffect(() => {
    if (!user) return;
    const titleRef = doc(db, 'users', user.uid, 'pad_meta', currentDate);
    const unsubscribe = onSnapshot(titleRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().title) {
        setPadTitle(docSnap.data().title);
      } else {
        setPadTitle('My Tasks');
      }
    });
    return () => unsubscribe();
  }, [currentDate, user]);

  // Handle midnight day rollover
  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayDateString();
      if (today !== currentDate) {
        setCurrentDate(today);
      }
    }, 1000 * 60); // Check every minute
    return () => clearInterval(interval);
  }, [currentDate]);

  // Firebase Real-time Listener for current date tasks
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tasks'), 
      where('date', '==', currentDate),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTodos = [];
      querySnapshot.forEach((docSnap) => {
        fetchedTodos.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by creation time to keep order stable
      fetchedTodos.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.toMillis() - b.createdAt.toMillis();
      });
      setTodos(fetchedTodos);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
    });

    return () => unsubscribe();
  }, [currentDate, user]);

  const saveTitle = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user) return;
    const newTitle = titleInput.trim() || 'My Tasks';
    setEditingTitle(false);
    
    try {
      const titleRef = doc(db, 'users', user.uid, 'pad_meta', currentDate);
      await setDoc(titleRef, { title: newTitle, userId: user.uid }, { merge: true });
    } catch (err) {
      console.error("Error saving title: ", err);
      setPadTitle(newTitle); // Fallback for offline/errors
    }
  };

  const startEditing = (id, currentText) => {
    setEditingId(id);
    setEditingText(currentText);
  };

  const saveEdit = async (e, id) => {
    if (e && e.preventDefault) e.preventDefault();
    if (editingId !== id || !user) return;
    
    const newText = editingText.trim();
    if (!newText) {
      setEditingId(null);
      return;
    }
    
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        text: newText
      });
    } catch (err) {
      console.error("Error editing task: ", err);
    }
    
    setEditingId(null);
    setEditingText('');
  };

  const toggleTodo = async (id, completed) => {
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        completed: !completed
      });
    } catch (e) {
      console.error("Error toggling task: ", e);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const taskRef = doc(db, 'tasks', id);
      await deleteDoc(taskRef);
    } catch (e) {
      console.error("Error deleting task: ", e);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;
    
    const taskText = inputValue;
    setInputValue('');
    
    try {
      await addDoc(collection(db, 'tasks'), {
        text: taskText,
        completed: false,
        date: currentDate,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      setInputValue(taskText);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDisplayDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (authChecking) {
    return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'white', fontFamily:'"Playfair Display", serif', fontSize:'2rem'}}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const specialEmails = ['rubyayisha26@gmail.com', 'mohananmidhun133@gmail.com'];
  const isSpecialUser = specialEmails.includes(user.email);

  const renderLogoutModal = () => showLogoutModal && (
    <div className="modal-overlay">
      <div className="custom-modal">
        <h2 className="modal-title">Sign Out</h2>
        <p className="modal-text">Are you sure you want to close your notepad?</p>
        <div className="modal-actions">
          <button className="modal-btn cancel-btn" onClick={() => setShowLogoutModal(false)}>Stay</button>
          <button className="modal-btn confirm-btn" onClick={() => {
            setShowLogoutModal(false);
            signOut(auth);
          }}>Sign Out</button>
        </div>
      </div>
    </div>
  );

  if (isSpecialUser && !hasSeenSpecial) {
    return (
      <div className="app-root-container">
        <SpecialPage 
          user={user} 
          onContinue={() => setHasSeenSpecial(true)} 
          onSignOut={() => setShowLogoutModal(true)} 
        />
        {renderLogoutModal()}
      </div>
    );
  }

  return (
    <>
      <div className="desk-container">
      <div className="pad-wrapper">
        <div className="pad-binding">
          <div className="user-profile-widget">
            {user && user.photoURL && (
              <img src={user.photoURL} alt="Profile" className="profile-pic" title={user.displayName || "User"} />
            )}
            <button 
              onClick={() => setShowLogoutModal(true)} 
              className="logout-btn" 
              title="Sign Out"
            >✖</button>
          </div>
        </div>
        <div className="legal-pad">
          <div className="pad-header">
            {editingTitle ? (
              <form onSubmit={saveTitle} style={{ width: '100%' }}>
                <input 
                  type="text" 
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="pad-title-input"
                  autoFocus
                  onBlur={saveTitle}
                />
              </form>
            ) : (
              <div className="pad-title-container">
                <h1 className="pad-title" onClick={() => { setEditingTitle(true); setTitleInput(padTitle); }} title="Click to edit">{padTitle}</h1>
                <button 
                  onClick={() => { setEditingTitle(true); setTitleInput(padTitle); }} 
                  className="edit-title-btn" 
                  aria-label="Edit Title"
                >✎</button>
              </div>
            )}
            <div className="header-details">
              <div className="date-field">
                <button onClick={() => changeDate(-1)} className="day-nav-btn" title="Previous Day">◀</button>
                <span className="current-date-text">{formatDisplayDate(currentDate)}</span>
                {currentDate !== getTodayDateString() && (
                  <button onClick={() => setCurrentDate(getTodayDateString())} className="today-btn" title="Back to Today">Today</button>
                )}
              </div>
              <div className="completed-counter">
                <span className="counter-icon">☑</span> {todos.filter(t => t.completed).length} / {todos.length} done
              </div>
            </div>
          </div>
          <div className="pad-content">
            <ul className="todo-list">
              {todos.map(todo => (
                <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id, todo.completed)}
                    />
                    <span className="checkmark"></span>
                  </label>
                  {editingId === todo.id ? (
                    <form onSubmit={(e) => saveEdit(e, todo.id)} style={{flexGrow: 1, display: 'flex', alignItems: 'center'}}>
                      <input 
                        type="text" 
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="todo-input edit-mode"
                        autoFocus
                        onBlur={(e) => saveEdit(e, todo.id)}
                      />
                    </form>
                  ) : (
                    <span className="todo-text">{todo.text}</span>
                  )}
                  {editingId !== todo.id && (
                    <button onClick={() => startEditing(todo.id, todo.text)} className="edit-btn" aria-label="Edit">✎</button>
                  )}
                  <button onClick={() => deleteTodo(todo.id)} className="delete-btn" aria-label="Delete">×</button>
                </li>
              ))}
            </ul>
            <form onSubmit={addTodo} className="add-todo-form">
              <button type="submit" className="add-icon">+</button>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Write a new task..."
                className="todo-input"
              />
            </form>
          </div>
          {todos.length > 5 && (
            <div className="pad-footer">
              <button onClick={scrollToTop} className="back-to-top-btn">
                &uarr; Back to Top
              </button>
            </div>
          )}
        </div>
      </div>

      </div>
      {renderLogoutModal()}
    </>
  );
}

export default App;

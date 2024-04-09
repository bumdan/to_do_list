import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaUndo, FaCheck} from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import './TodoApp.css';

function TodoApp() {
  const U = 'http://localhost:5000/tasks'; //for get method
  const url = 'http://localhost:5000/task'; //for post method
  const [task, setTest] = useState('');
  const [lists, setLists] = useState([]);
  const [error, setError] = useState('');
  const [editingListId, setEditingListId] = useState(null);
  const [filterType, setFilterType] = useState('all');

  function To_Do_List() {
    fetch(U)
      .then((response) => response.json())
      .then((data) => {
        setLists(data.data);
      });
  };

  useEffect(function () {
    To_Do_List();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (task.trim() === '') {
      setError('Please enter a sentence!');
      return;

    } 
    if (editingListId) {
      await axios.put(`${url}/${editingListId}/edit`,{
        task,
      });

      Swal.fire({
        title: 'Updated Successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
      });
      
    } else {
      await axios.post(url, {
        task,
      });

      Swal.fire({
        title: 'Created Successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
      });
    };

    To_Do_List();

    resetForm();

  };

  function resetForm() {
    setTest('');
    setEditingListId(null);
    setError('');
  }

  function handleEdit(listId) {
    const listToEdit = lists.find(function (list) {
      return list.id === listId;
    });

   if (listToEdit) {
      setTest(listToEdit.task);
      setEditingListId(listId);


      }
  }
  async function handleDelete(list_id) {

    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      width: 300,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Delete!",
    });

    if (result.isConfirmed) {
      console.log(list_id)
      await axios.delete(`${url}`, {params: {id : list_id}});
      To_Do_List();

      Swal.fire({
        title: "Deleted!",
        text: "Your task has been deleted.",
        icon: "success",
        width: 300,
      });
    }
  }

  async function handleSuccess(listId) {

    await axios.patch(`${url}/${listId}`, {complated: true});

    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId ? { ...list, complated: true } : list
      )
    );
  }

  async function handleUndo(listId) {
    await axios.patch(`${url}/${listId}`, {complated: false});

    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId ? { ...list, complated: false } : list
      )
    );
  }

  async function getCompletedTasks() {
    const response = await axios.get(`${U}`,{params:{status:"true"}});
    setLists(response.data.data);
  }

  async function getunCompletedTasks() {
    const response = await axios.get(`${U}`,{params:{status:"false"}});
    setLists(response.data.data)
  }

  async function toggleFilter() {
    let newFilterType = 'all';

    switch (filterType) {
      case 'all':
        newFilterType = 'uncompleted';
        await getunCompletedTasks();
        break;
      case 'uncompleted':
        newFilterType = 'completed';
        await getCompletedTasks();
        break;
      case 'completed':
        newFilterType = 'all';
        To_Do_List();
        break;
      default:
        break;
    }

    setFilterType(newFilterType);
  }

  function showTaskDetails(list) {
    Swal.fire({
      title: 'Task Details',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="font-weight: bold;">Task:   ${list.task}</p>
          <p style="font-weight: bold;">Status:  ${list.complated ? 'Completed' : 'Uncompleted'}</p>
          <p style="font-weight: bold;">Created At: ${list.created_at}</p>
          ${list.updated_at ? `<p style="font-weight: bold;">Updated At: ${list.updated_at}</p>` : ''}

        </div>
      `,
      icon: 'info',
      confirmButtonText: 'OK',
    });
  }
  
  return (
    <div className="container">
      <h1>What Is Your Plan Today</h1>

      <form onSubmit={handleSubmit}>
        <input id='input' value={task} onChange={(e) => setTest(e.target.value)} type="text" placeholder="what you want to do.." />
        <button id="submit" type="submit">{editingListId ? <FaEdit/> : 'Submit'}</button>
        <select id='filter' onChange={toggleFilter} value={filterType}>
          <option value='all'>Show All</option>
          <option value='uncompleted'>Uncompleted</option>
          <option value='completed'>Completed</option>
      </select>
      </form>
      {error && <span style={{ color: 'red' }}>{error}</span>}
      <ul>
        {lists.map((list) => (
          <li key={list.id} className={list.complated ? 'completed-task' : ''}>
            <span className="time">{list.created_at}</span>
            <div></div>
            <span onClick={() => showTaskDetails(list)}>{list.task}</span>
            <button id="delete" onClick={() => handleDelete(list.id)}><FaTrash/></button>
            {list.complated && (
                <button id='undo' onClick={() => handleUndo(list.id)}><FaUndo/></button>
              )}
            {!list.complated && (
              <>
                <button id="edit" onClick={() => handleEdit(list.id)}><FaEdit/></button>
                <button id="success" onClick={() => handleSuccess(list.id)}><FaCheck/></button>
              </>
            )}
          </li>
        ))}

      </ul>

    </div>
  );
};

export default TodoApp;

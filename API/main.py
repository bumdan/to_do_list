from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import datetime

app = Flask(__name__)
CORS(app)

client = MongoClient('mongodb://localhost:27017/')
db = client['todolist']
collection = db['tasks']

@app.route('/task', methods=['POST'])
def task_page():
        data = request.get_json()
        task = data.get('task')

        if task is not None and task.strip() != "":
            current_time = datetime.datetime.now()
            collection.insert_one({'task': task.strip(), 'create_at': current_time, 'complated': False})
            return jsonify({"message": "Task created successfully"}), 202
        
        else:
             return jsonify({"message": "Task cannot be empty"}), 400

@app.route('/tasks', methods=['GET'])
def tasks_page():
    status = request.args.get("status", default=None)

    if status is None:
        query = {}
        
    else:

        if status.upper() == 'TRUE' :
            status=True
        elif status.upper() == 'FALSE':
            status=False
        else:
            return jsonify({"message": "Invalid parameter"}), 400
        query = {'complated': status}

    col = collection.find(query).sort('create_at', -1)

    data_set = {
        'data': [
            {'id': str(doc['_id']), 'task': doc['task'],
              'created_at': doc.get('create_at'), 
              'complated': doc['complated'], 
              'updated_at': doc.get('updated_at')
              }
            for doc in col
        ]
    }

    return jsonify(data_set)

@app.route('/task', methods=['GET'])
def get_task():  
    try:  
        list_id = request.args.to_dict().get('id', '<string:list_id>')  
        doc = collection.find_one({'_id': ObjectId(list_id)})
        if doc:
            task_data = {
                 'data': [
                      {'id': str(doc['_id']), 'task': doc['task'], 'created_at': doc.get('create_at'), 'complated': doc['complated']}
                 ]
            }
            return jsonify(task_data)
        else:
            return jsonify({"error": f"Task with id {list_id} not found"}), 404

    except Exception as e:
         return jsonify({"error": "Task not found"}), 400


@app.route('/task', methods=['DELETE'])
def delete_task():

    try:
        list_id = request.args.to_dict().get('id', '<string:list_id>')
        result = collection.delete_one({'_id': ObjectId(list_id)})
        print(list_id)

        if result.deleted_count == 1:
            return jsonify({"message": "Task deleted successfully"})
        
        else:
            return jsonify({"error": f"id {list_id} not found"}), 404
            
        
    except Exception as e:
         return jsonify({"error": "id not found"}), 404


@app.route('/task/<string:list_id>/edit', methods=['PUT'])
def edit_task(list_id):

    try:
            doc = collection.find_one({'_id': ObjectId(list_id)})
            data = request.get_json()
            task = data.get('task')
            new_task = data.get('task', doc['task'])
            complated = data.get('complated', doc['complated'])

            if new_task and new_task.strip() != "" and task is not None:
                current_time = datetime.datetime.now()
                collection.update_one({'_id': ObjectId(list_id)},
                                    {'$set': {'task': new_task.strip(), 'updated_at': current_time, 'complated': complated}}
                                    )
                return jsonify({'message': "Task Updated successfully"})
                
            else:
                return jsonify({"error": "New task cannot be empty"}), 400   
    except Exception as e:
        return jsonify({"error": "Task with id not found"}), 404
    
@app.route('/task/<string:list_id>', methods=['PATCH'])
def handle_task(list_id):
        
    try:
        data = request.get_json()
        complated = data.get("complated")

        if complated is not None and complated.strip() != "":
            current_time = datetime.datetime.now()
            collection.update_one({'_id': ObjectId(list_id)},
                                  {'$set': {'complated': complated, 'status_update': current_time}})
            
            return jsonify({'message': "Task status updated successfully"}),201
        else:
            return jsonify({"error": "Invalid data in the request"}), 400
    
    except Exception as e:
        return jsonify({"error": "Task with id not found. complated should be true or false "}), 404


if __name__ == "__main__":
    app.run(debug=True)
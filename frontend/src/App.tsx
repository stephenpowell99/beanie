import { useState, useEffect } from "react";
import axios from "axios";

type User = {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/users");
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Beanie App</h1>
          <p className="text-xl text-gray-600 mb-12">
            A React + Node.js + PostgreSQL application
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>

          {loading ? (
            <p className="text-gray-500">Loading users...</p>
          ) : users.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className="py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{user.name || "No name"}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-sm text-gray-400">ID: {user.id}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              No users found. Add user data to your database.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

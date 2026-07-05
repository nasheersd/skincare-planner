import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    api.get("/users/me").then((res) => setMe(res.data));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Dashboard</h2>
      {me && (
        <div>
          <p>Welcome, {me.full_name} ({me.role})</p>
          <ul>
            <li>Skin Profile: complete it under "Skin Profile"</li>
            <li>Lifestyle tracking: log today's habits under "Skin Assessment"</li>
            <li>AI-powered recommendations arrive in Milestone 2+</li>
          </ul>
        </div>
      )}
    </div>
  );
}

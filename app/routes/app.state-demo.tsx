import { useState, useEffect } from "react";

export default function StateDemo() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // Log before setState
    console.log("Before setState:", count);

    setCount(count + 1);

    // Log immediately after setState
    console.log("Right after setState:", count);

    // Use setTimeout to log after a delay
    setTimeout(() => {
      console.log("In next tick:", count);
    }, 0);
  };

  // Use useEffect to see when the state actually updates
  useEffect(() => {
    console.log("State actually updated to:", count);
  }, [count]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>setState Async Demonstration</h1>
      <p>Current count: {count}</p>
      <button onClick={handleClick}>Increment</button>
      <p>Check the console logs to see the async behavior</p>
    </div>
  );
}

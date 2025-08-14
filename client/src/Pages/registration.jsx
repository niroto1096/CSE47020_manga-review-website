import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { registration } from "@/Api/authApi";

const Registration = () => {
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    phone: "",
    company: "",
    website: "",
    role: "user",
  });

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setRole(storedRole);
      setForm((prev) => ({ ...prev, role: storedRole }));
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    localStorage.setItem('email',form.email)
    console.log("Form Submitted:", form);

    try{
      const response = await registration(form)
      console.log(response)
      navigate('/otp')
    }catch(error){
        console.log(error)
    }
    
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 w-full max-w-md p-6 border rounded-xl shadow"
      >
        <h2 className="text-2xl font-bold text-center mb-2">
          Register 
        </h2>

        <Input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <Input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          required
        />

        <Input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          required
        />

        {role === "seller" && (
          <>
            <Input
              name="company"
              placeholder="Company Name"
              value={form.company}
              onChange={handleChange}
              required
            />

            <Input
              name="companyWebsite"
              placeholder="Company Website (optional)"
              value={form.companyWebsite}
              onChange={handleChange}
            />
          </>
        )}

        <Button type="submit" className="w-full mt-4 ">
          Register
        </Button>

        <p>Already have an account? <Link to='/login'>Log in</Link></p>
      </form>
    </div>
  );
};

export default Registration;

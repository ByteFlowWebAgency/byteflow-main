
import React, { useState, ChangeEvent, FormEvent } from "react";
import emailjs from "emailjs-com";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import clsx from "clsx";
import TermsModal from "./TermsModal";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  service: string;
  role: string;
  message: string;
  terms: boolean;
};

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    service: "",
    role: "",
    message: "",
    terms: false,
  });

  const [isModalOpen, setModalOpen] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      setFormData({
        ...formData,
        [name]: e.target.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const templateParams = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      service: formData.service,
      role: formData.role,
      message: formData.message,
    };

    emailjs
      .send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_USER_ID || ""
      )
      .then(
        () => {
          Swal.fire({
            title: "Success!",
            html: 'Your message has been sent successfully! Please <a href="https://calendly.com/byteflowservices" target="_blank" style="color: #3085d6;">schedule a meeting 📆</a> if you haven\'t.',
            icon: "success",
            confirmButtonColor: "#3085d6",
            background: "#1a202c",
            color: "#fff",
          });
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            service: "",
            role: "",
            message: "",
            terms: false,
          });
        },
        (error) => {
          console.error("Email sending error:", error);
          Swal.fire({
            title: "Error!",
            text: "Something went wrong. Try again☹️",
            icon: "error",
            confirmButtonColor: "#e53e3e",
            background: "#1a202c",
            color: "#fff",
          });
        }
      );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-16">
      <form
        className="w-full max-w-4xl bg-gray-900/80 p-8 rounded-lg shadow-lg text-white animate-fade-in"
        onSubmit={handleSubmit}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Get in Touch</h1>
          <p className="text-gray-300">We`d love to hear from you!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            className="p-4 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            className="p-4 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="p-4 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="p-4 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mt-6">
          <select
            name="service"
            value={formData.service}
            onChange={handleChange}
            className="w-full p-4 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a Service</option>
            <option value="Web Design">Web Design</option>
            <option value="Mobile App Development">Mobile App Development</option>
            <option value="Web Development">Web Development</option>
            <option value="Ecommerce">Ecommerce</option>
            <option value="SEO">SEO</option>
          </select>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {["Business Owner", "Service Provider", "Potential Partner", "Investor Inquiry", "Other"].map(
            (role, idx) => (
              <label key={idx} className="flex items-center space-x-2 text-gray-300">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={formData.role === role}
                  onChange={handleChange}
                  className="form-radio text-blue-500"
                  required
                />
                <span>{role}</span>
              </label>
            )
          )}
        </div>

        <div className="mt-6">
          <textarea
            name="message"
            placeholder="Write your message..."
            value={formData.message}
            onChange={handleChange}
            className="w-full h-32 p-4 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        {/* Terms Agreement */}
        <div className="mt-6 flex items-center space-x-2 text-gray-300">
          <input
            type="checkbox"
            name="terms"
            checked={formData.terms}
            onChange={handleChange}
            className="form-checkbox text-blue-500"
            required
          />
          <span>
            I agree to the{" "}
            <button
              type="button"
              className="underline text-blue-400 hover:text-blue-500"
              onClick={() => setModalOpen(true)}
            >
              Terms of Agreement and Privacy Policy
            </button>
          </span>
        </div>

        <button
          type="submit"
          className={clsx(
            "w-full mt-6 p-4 focus:ring-offset-3 relative rounded-md border border-blue-100/20 bg-blue-200/10 px-4 py-2 text-blue-200 outline-none ring-blue-300 transition-colors after:absolute after:inset-0 after:-z-10 after:animate-pulse after:rounded-full after:bg-blue-100 after:bg-opacity-0 after:blur-md after:transition-all after:duration-500 hover:border-blue-200/40 hover:text-blue-300 after:hover:bg-opacity-15 focus:ring-2"
          )}
        >
          Take a Byte
        </button>
      </form>
      
      {/* Modal */}
      <TermsModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default ContactForm;

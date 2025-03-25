// app/officials/apply/page.tsx
'use client';
import React, { useState } from 'react';
import type { DocumentData } from 'firebase/firestore';
import Header from '@/components/headers/Header';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}
interface OfficialsData {
  data: Array<{
    id: string;
    officialId: string;
    first: string;
    last: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    muayThaiExperience: string;
    judgedBefore: boolean;
    position: string;
    quizScore: number;
  }>;
}
const quizQuestions: QuizQuestion[] = [
  {
    question: "What is the primary goal of Point Muay Thai (PMT)?",
    options: [
      "To knock out the opponent",
      "To develop Muay Thai technique without risk of injury",
      "To score as many full contact strikes as possible",
      "To win by submission"
    ],
    correctAnswer: 1
  },
  {
    question: "What happens if a strike makes full contact during a PMT bout?",
    options: [
      "Extra points are awarded",
      "A warning is given",
      "The fighter could be disqualified",
      "The round is paused"
    ],
    correctAnswer: 2
  },
  {
    question: "Which of these techniques is allowed in PMT?",
    options: [
      "Knees to the head",
      "Leg teeps",
      "Front foot sweeps",
      "Hip throws"
    ],
    correctAnswer: 2
  },
  {
    question: "How many rounds are PMT bouts generally?",
    options: [
      "1 round only",
      "2 rounds with possible 3rd overtime round",
      "3 rounds always",
      "5 rounds"
    ],
    correctAnswer: 1
  },
  {
    question: "What glove size is required for adult PMT bouts?",
    options: [
      "12oz",
      "14oz",
      "16oz",
      "18oz"
    ],
    correctAnswer: 2
  }
];

export default function OfficialsApplication() {
    const [currentStep, setCurrentStep] = useState<'quiz' | 'form' | 'submitted'>('quiz');
    const [answers, setAnswers] = useState<number[]>([]);
    const [formData, setFormData] = useState({
      first: '',
      last: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      muayThaiExperience: '',
      judgedBefore: false
    });
    const [error, setError] = useState('');
  
    const handleQuizSubmit = () => {
      if (answers.length !== quizQuestions.length) {
        setError('Please answer all questions');
        return;
      }
  
      const correctAnswers = answers.reduce((acc, answer, index) => 
        acc + (answer === quizQuestions[index].correctAnswer ? 1 : 0), 0);
      
      const passed = (correctAnswers / quizQuestions.length) >= 0.8; // 80% passing grade
      
      if (passed) {
        setCurrentStep('form');
        setError('');
      } else {
        setError('You need to score at least 80% to proceed. Please try again.');
      }
    };
  
    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
  
      try {
        const { collection, doc, getDoc, setDoc } = (await import('firebase/firestore'));
        const { db } = (await import('@/lib/firebase_techbouts/config'));
  
        const officialId = `${formData.first.replace(/\s+/g, '').toLowerCase()}${formData.last.replace(/\s+/g, '').toLowerCase()}${Math.floor(Math.random() * 10000)}`;
  
        const officialsRef = collection(db, 'officials');
        const officialsDoc = doc(officialsRef, 'officials_json');
        const docSnap = await getDoc(officialsDoc);
  
        let existingData: OfficialsData = { data: [] };
        if (docSnap.exists()) {
          // Cast the document data to our OfficialsData type
          const docData = docSnap.data() as DocumentData;
          existingData = {
            data: Array.isArray(docData.data) ? docData.data : []
          };
        }
  
        const newOfficial = {
          ...formData,
          id: officialId,
          officialId,
          position: 'pending',
          quizScore: (answers.reduce((acc, answer, index) => 
            acc + (answer === quizQuestions[index].correctAnswer ? 1 : 0), 0) / quizQuestions.length) * 100
        };
  
        await setDoc(officialsDoc, {
          ...existingData,
          data: [...existingData.data, newOfficial]
        });
  
        setCurrentStep('submitted');
      } catch (error) {
        console.error('Error saving application:', error);
        setError('Failed to submit application. Please try again.');
      }
    };

  if (currentStep === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Application Submitted!</h1>
        <p>Thank you for applying. We will review your application and contact you soon.</p>
      </div>
    );
  }

  return (
    <div>
<Header />

    <div className="flex justify-center mb-6">
      <img
        src="/logos/pmt_logo_2024_sm.png"
        alt="PMT Logo"
        className="w-48"
        style={{ width: '200px' }}
      />
    </div>

      <h1 className="text-2xl font-bold mb-6 text-center">Point Muay Thai Official Application</h1>
      
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

<div className="flex flex-col items-center text-center">
  <div>Review the Rules and take this short quiz to open up your contact information form</div>
  <div className="m-4">
    <a
      href="https://www.pmt-west.app/rules"
      target="_blank"
      rel="noopener noreferrer"
      className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">      View PMT Rules
    </a>
  </div>
</div>
      {currentStep === 'quiz' && (
        <div className='pr-10 pl-10'>
                    <h2 className="text-xl font-semibold mb-4">Rules Quiz</h2>
          {quizQuestions.map((q, qIndex) => (
            <div key={qIndex} className="mb-6">
              <p className="font-medium mb-2">{q.question}</p>
              {q.options.map((option, oIndex) => (
                <div key={oIndex} className="mb-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      checked={answers[qIndex] === oIndex}
                      onChange={() => {
                        const newAnswers = [...answers];
                        newAnswers[qIndex] = oIndex;
                        setAnswers(newAnswers);
                      }}
                      className="form-radio"
                    />
                    <span>{option}</span>
                  </label>
                </div>
              ))}
            </div>
          ))}


<div className="flex flex-col items-center text-center">

          <button
            onClick={handleQuizSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit Quiz
          </button>
</div>

        </div>

      )}

      {currentStep === 'form' && (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first}
                onChange={e => setFormData({...formData, first: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last}
                onChange={e => setFormData({...formData, last: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Phone</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">State</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={e => setFormData({...formData, state: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">Muay Thai Experience</label>
            <textarea
              required
              value={formData.muayThaiExperience}
              onChange={e => setFormData({...formData, muayThaiExperience: e.target.value})}
              className="w-full p-2 border rounded"
              rows={4}
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.judgedBefore}
                onChange={e => setFormData({...formData, judgedBefore: e.target.checked})}
                className="form-checkbox"
              />
              <span>Have you judged Muay Thai events before?</span>
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit Application
          </button>
        </form>
      )}
    </div>
  );
}
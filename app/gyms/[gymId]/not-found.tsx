import Link from 'next/link';

export default function NotFound() {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Gym Not Found</h1>
          <p className="text-gray-600 mb-4">
            The gym you&apos;re looking for could not be found. This could be because:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6">
            <li>The gym ID is incorrect</li>
            <li>The gym has been removed</li>
            <li>The gym hasn&apos;t been added to our database yet</li>
          </ul>
          <Link 
            href="/gyms" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Return to Gyms List
          </Link>
        </div>
      </div>
    );
  }
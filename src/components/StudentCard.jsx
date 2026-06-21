import { GraduationCap, MapPin } from "lucide-react"

export default function StudentCard({ student, onCall }) {
  return (
    <div
      className="
      bg-slate-900
      border
      border-slate-800
      rounded-2xl
      p-4
      flex
      items-center
      justify-between
      hover:border-blue-500
      transition
    "
    >
      <div className="flex items-center gap-4">

        <img
          src={student.photo}
          alt={student.name}
          className="
            w-16
            h-16
            rounded-xl
            object-cover
          "
        />

        <div>

          <h2 className="text-white font-bold text-lg">
            {student.name}
          </h2>

          <div className="flex items-center gap-2 mt-1 text-slate-400">
            <GraduationCap size={16} />
            <span>{student.classroom}</span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-green-400">
            <MapPin size={16} />
            <span>{student.exit}</span>
          </div>

        </div>
      </div>

      <button
        onClick={() => onCall(student)}
        className="
          bg-blue-600
          hover:bg-blue-700
          text-white
          font-semibold
          px-5
          py-3
          rounded-xl
          transition
          shadow-lg
          shadow-blue-500/20
        "
      >
        Chamar
      </button>
    </div>
  )
}
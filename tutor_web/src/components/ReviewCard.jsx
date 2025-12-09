// import { Star } from 'lucide-react';
//
// export function ReviewCard({ review }) {
//   return (
//     <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-primary-100">
//       <div className="flex items-start gap-4 mb-3">
//         <img
//           src={review.studentAvatar}
//           alt={review.studentName}
//           className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
//         />
//         <div className="flex-1">
//           <div className="flex items-center justify-between mb-1">
//             <h5 className="text-neutral-900">{review.studentName}</h5>
//             <div className="flex items-center gap-1">
//               {[...Array(5)].map((_, i) => (
//                 <Star
//                   key={i}
//                   className={`w-4 h-4 ${
//                     i < review.rating
//                       ? 'fill-yellow-400 text-yellow-400'
//                       : 'text-neutral-300'
//                   }`}
//                 />
//               ))}
//             </div>
//           </div>
//           <p className="text-xs text-neutral-500">
//             {new Date(review.datePosted).toLocaleDateString('ru-RU', {
//               day: 'numeric',
//               month: 'long',
//               year: 'numeric',
//             })}
//           </p>
//         </div>
//       </div>
//       <p className="text-sm text-neutral-700">{review.comment}</p>
//     </div>
//   );
// }

// ReviewCard.jsx
import { Star } from 'lucide-react';

export function ReviewCard({ review }) {
    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-neutral-200">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {review.tutorAvatar ? (
                        <img
                            src={review.tutorAvatar}
                            alt={review.tutorName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                                {review.tutorName?.charAt(0) || 'Р'}
                            </span>
                        </div>
                    )}
                    <div>
                        <h4 className="text-neutral-900 font-medium">
                            {review.tutorName}
                        </h4>
                        <p className="text-sm text-neutral-600">
                            {review.lessonSubject}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-4 h-4 ${
                                    star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-neutral-300'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-neutral-500 mt-1 block">
                        {review.date || 'Недавно'}
                    </span>
                </div>
            </div>

            {review.comment && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-neutral-700 text-sm leading-relaxed">
                        {review.comment}
                    </p>
                </div>
            )}
        </div>
    );
}
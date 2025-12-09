// import { Star, Clock, DollarSign, Award } from 'lucide-react';
// import { Button } from './ui/button';
// import { Badge } from './ui/badge';
// // import { Star, Clock, Award } from 'lucide-react';
//
// export function TutorCard({ tutor, onViewDetails }) {
//     // Форматирование рейтинга
//     const formatRating = (rating) => {
//         return rating.toFixed(1);
//     };
//
//     // Форматирование отзывов
//     const formatReviewCount = (count) => {
//         if (count === 0) return 'нет отзывов';
//         if (count === 1) return '1 отзыв';
//         if (count < 5) return `${count} отзыва`;
//         return `${count} отзывов`;
//     };
//
//     return (
//         <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
//             {/* Верхняя часть с аватаром и рейтингом */}
//             <div className="flex items-start gap-4 mb-4">
//                 <div className="flex-shrink-0">
//                     <img
//                         src={tutor.avatarUrl}
//                         alt={tutor.name}
//                         className="w-16 h-16 rounded-full object-cover border-2 border-primary-100"
//                     />
//                 </div>
//
//                 <div className="flex-1">
//                     <div className="flex items-start justify-between">
//                         <div>
//                             <h3 className="font-semibold text-neutral-900">{tutor.name}</h3>
//                             <div className="flex items-center gap-2 mt-1">
//                                 <div className="flex items-center gap-1">
//                                     <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
//                                     <span className="text-sm font-medium text-neutral-900">
//                     {formatRating(tutor.rating || 4.5)}
//                   </span>
//                                 </div>
//                                 <span className="text-neutral-400">•</span>
//                                 <span className="text-sm text-neutral-600">
//                   {formatReviewCount(tutor.reviewCount || 0)}
//                 </span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//
//             {/* Предметы */}
//             <div className="mb-4">
//                 <div className="flex flex-wrap gap-2">
//                     {tutor.subjects?.map((subject, index) => (
//                         <span
//                             key={index}
//                             className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200"
//                         >
//               {subject}
//             </span>
//                     ))}
//                 </div>
//             </div>
//
//             {/* Описание */}
//             <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
//                 {tutor.bio || 'Опытный репетитор с индивидуальным подходом к каждому ученику.'}
//             </p>
//
//             {/* Нижняя часть с опытом и ценой */}
//             <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
//                 <div className="flex items-center gap-3">
//                     {/* ИСПРАВЛЕНО: Отображаем опыт */}
//                     {tutor.experienceYears > 0 && (
//                         <div className="flex items-center gap-1 text-sm text-neutral-600">
//                             <Award className="w-4 h-4 text-primary-600" />
//                             <span>{tutor.experienceYears} лет опыта</span>
//                         </div>
//                     )}
//                 </div>
//
//                 <div className="text-right">
//                     <div className="text-lg font-semibold text-neutral-900">
//                         {tutor.pricePerHour || 1500} ₽/час
//                     </div>
//                 </div>
//             </div>
//
//             {/* Кнопка подробнее */}
//             <button
//                 onClick={onViewDetails}
//                 className="w-full mt-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
//             >
//                 Подробнее
//             </button>
//         </div>
//     );
// }
// // export function TutorCard({ tutor, onViewDetails }) {
// //   return (
// //     <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-primary-100">
// //       <div className="flex items-start gap-4 mb-4">
// //         <img
// //           src={tutor.avatar}
// //           alt={tutor.name}
// //           className="w-20 h-20 rounded-full object-cover border-4 border-primary-200"
// //         />
// //         <div className="flex-1">
// //           <h3 className="text-neutral-900 mb-1">{tutor.name}</h3>
// //           <div className="flex items-center gap-1 mb-2">
// //             <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
// //             <span className="text-neutral-700">{tutor.ratingAvg}</span>
// //             <span className="text-xs text-neutral-500">({tutor.reviewCount} отзывов)</span>
// //           </div>
// //           <div className="flex flex-wrap gap-1">
// //             {tutor.subjects.map((subject, index) => (
// //               <Badge key={index} className="bg-secondary-100 text-secondary-700 border-secondary-200">
// //                 {subject}
// //               </Badge>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //
// //       <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{tutor.bio}</p>
// //
// //       <div className="flex items-center justify-between mb-4 text-sm">
// //         <div className="flex items-center gap-2 text-neutral-600">
// //           <Clock className="w-4 h-4" />
// //           <span>{tutor.experience} лет опыта</span>
// //         </div>
// //         <div className="flex items-center gap-1 text-primary-600">
// //           <DollarSign className="w-4 h-4" />
// //           <span>{tutor.pricePerHour} ₽/час</span>
// //         </div>
// //       </div>
// //
// //       <Button
// //         onClick={() => onViewDetails(tutor.id)}
// //         className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white"
// //       >
// //         Подробнее
// //       </Button>
// //     </div>
// //   );
// // }
import { Star, Clock, DollarSign, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function TutorCard({ tutor, onViewDetails }) {
    // ИСПРАВЛЕННАЯ функция форматирования рейтинга
    const formatRating = (rating) => {
        const numRating = Number(rating);
        return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
    };

    // Форматирование отзывов
    const formatReviewCount = (count) => {
        const numCount = Number(count) || 0;
        if (numCount === 0) return 'нет отзывов';
        if (numCount === 1) return '1 отзыв';
        if (numCount < 5) return `${numCount} отзыва`;
        return `${numCount} отзывов`;
    };

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Верхняя часть с аватаром и рейтингом */}
            <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                    <img
                        src={tutor.avatarUrl}
                        alt={tutor.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary-100"
                    />
                </div>

                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-neutral-900">{tutor.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-medium text-neutral-900">
                                        {formatRating(tutor.rating || 4.5)}
                                    </span>
                                </div>
                                <span className="text-neutral-400">•</span>
                                <span className="text-sm text-neutral-600">
                                    {formatReviewCount(tutor.reviewCount || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Предметы */}
            <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                    {tutor.subjects?.map((subject, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200"
                        >
                            {subject}
                        </span>
                    ))}
                </div>
            </div>

            {/* Описание */}
            <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                {tutor.bio || 'Опытный репетитор с индивидуальным подходом к каждому ученику.'}
            </p>

            {/* Нижняя часть с опытом и ценой */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-3">
                    {/* ИСПРАВЛЕНО: Отображаем опыт */}
                    {tutor.experienceYears > 0 && (
                        <div className="flex items-center gap-1 text-sm text-neutral-600">
                            <Award className="w-4 h-4 text-primary-600" />
                            <span>{tutor.experienceYears} лет опыта</span>
                        </div>
                    )}
                </div>

                <div className="text-right">
                    <div className="text-lg font-semibold text-neutral-900">
                        {tutor.pricePerHour || 1500} ₽/час
                    </div>
                </div>
            </div>

            {/* Кнопка подробнее */}
            <button
                onClick={() => onViewDetails(tutor.id)}
                className="w-full mt-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
                Подробнее
            </button>
        </div>
    );
}
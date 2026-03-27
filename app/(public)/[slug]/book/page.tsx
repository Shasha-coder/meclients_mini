import { getPublicBookingProfile } from '@/app/actions/bookings'
import BookingClient from './BookingClient'
import { notFound } from 'next/navigation'

export default async function PublicBookingPage({ params }: { params: { slug: string } }) {
  try {
    const data = await getPublicBookingProfile(params.slug)
    
    return (
      <BookingClient 
        profile={data.profile} 
        services={data.services} 
        availability={data.availability} 
      />
    )
  } catch (error) {
    console.error(error)
    notFound()
  }
}

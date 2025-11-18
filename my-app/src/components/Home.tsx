import React from 'react'
import TextType from './TextType'

const Home = () => {
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div>
        <TextType
          text={["Welkom bij TixFlow"]}
          typingSpeed={75}
          pauseDuration={1500}
          loop={false}
          showCursor={true}
          cursorCharacter="|"
          className="text-3xl font-semibold text-gray-900"
        />
        <p className="mt-3 text-sm text-gray-600">Organiseer events of bekijk je publieke eventpagina.</p>
      </div>
    </section>
  )
}

export default Home
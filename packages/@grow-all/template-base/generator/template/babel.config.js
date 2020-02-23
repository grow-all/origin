module.exports = {
  presets: [
    "@babel/preset-react",
    "@babel/preset-env",
  ],
  plugins: [{% if answers.ui %}
    ['import', {
      libraryName: '{{ answers.ui }}',
      libraryDirectory: 'es',
      style: true
    }]
  {% endif %}]
}
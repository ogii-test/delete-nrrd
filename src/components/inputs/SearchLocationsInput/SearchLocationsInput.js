import React, { useState } from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import { VariableSizeList } from 'react-window'

import PropTypes from 'prop-types'

import { useTheme, makeStyles } from '@material-ui/core/styles'
import {
  Box,
  TextField,
  useMediaQuery
} from '@material-ui/core'

import { Autocomplete } from '@material-ui/lab'

import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'

import mapJson from '../../sections/ExploreData/us-topology.json'
import mapStatesOffshore from '../../sections/ExploreData/states-offshore.json'

const GUTTER_SIZE = 15

const useStyles = makeStyles(theme => ({
  autoCompleteRoot: {
    color: theme.palette.primary.dark,
    minWidth: 250,
    maxWidth: 250,
    marginRight: theme.spacing(1),
    borderRadius: 4,
    transition: theme.transitions.create(['border-color', 'box-shadow'])
  },
  autoCompleteFocused: {
    borderRadius: 4,
    borderColor: '#80bdff',
    boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
  },
}))

// get region details from map object
const getRegionProperties = location => {
  // console.log('getRegionProperties input: ', location)

  let selectedObj

  switch (location.region_type) {
  case 'State':
    selectedObj = mapJson.objects.states.geometries.filter(obj => {
      if (parseInt(obj.properties.FIPS) === parseInt(location.fips_code)) {
        return Object.assign(obj, { locData: location })
      }
    })
    break
  case 'County':
    selectedObj = mapJson.objects.counties.geometries.filter(obj => {
      if (parseInt(obj.properties.FIPS) === parseInt(location.fips_code)) {
        return Object.assign(obj, { locData: location })
      }
    })
    break
  case 'Offshore':
    selectedObj = mapStatesOffshore.objects['states-offshore-geo'].geometries.filter(obj => {
      // console.log('Offshore obj: ', obj)
      if (obj.id.toLowerCase() === location.fips_code.toLowerCase()) {
        return Object.assign(obj, { locData: location })
      }
      else {
        console.warn(`Unable to find offshore id '${ location.fips_code }' in states-offshore-geo`)
      }
    })
    break
  default:
    console.warn('Unable to find state, county or offshore area')
    break
  }

  return selectedObj
}

// useResetCache
const useResetCache = data => {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true)
    }
  }, [data])
  return ref
}

// Render rows
const RenderRow = props => {
  const { data, index, style } = props
  return React.cloneElement(data[index], {
    style: {
      ...style,
      top: style.top + GUTTER_SIZE,
    }
  })
}

// Listbox component
const ListboxComponent = React.forwardRef((props, ref) => {
  const { children, role, ...other } = props

  const theme = useTheme()
  const smUp = useMediaQuery(theme.breakpoints.up('sm'))
  const itemData = React.Children.toArray(children)
  const itemCount = itemData.length
  const itemSize = smUp ? 50 : 45

  // console.log('ListboxComponent itemCount: ', itemData, itemCount)
  const getChildSize = child => {
    // console.log('getChildSize: ', child)
    const charCount = child.props.children.props.children.length
    if (React.isValidElement(child) && charCount > 20) {
      return 100
    }

    return itemSize
  }

  const listRef = useResetCache(itemCount)

  return (
    <div ref={ref}>
      <div {...other}>
        <VariableSizeList
          height={150}
          width={275}
          ref={listRef}
          itemCount={itemCount}
          itemData={itemData}
          itemSize={index => getChildSize(itemData[index])}
          innerElementType="ul"
          role="listbox"
          overscanCount={5}
          // debug={true}
        >
          {RenderRow}
        </VariableSizeList>
      </div>
    </div>
  )
})

// SearchLocationsInput
const SearchLocationsInput = props => {
  const data = useStaticQuery(graphql`
    query LocationQuery {
      onrr {
        distinct_locations: location(where: {fips_code: {_neq: ""}}, distinct_on: fips_code) {
          fips_code
          location_name
          region_type
          state
          state_name
        }
      }
    }
`)

  const classes = useStyles()
  const [input, setInput] = useState('')
  const [keyCount, setKeyCount] = useState(0)
  const { onLink } = props

  const handleSearch = event => {
    setInput(event.target.value)
  }

  const handleChange = val => {
    try {
      const item = getRegionProperties(val)
      onLink(item[0])
      setInput('')
      setKeyCount(keyCount + 1)
    }
    catch (err) {
      console.error('Oh no, seems there was an error trying to grab that location', err)
    }
  }

  const renderLabel = item => {
    const label = item
    const searchString = input

    if (searchString) {
      const index = label.toLowerCase().indexOf(searchString.toLowerCase())

      if (index !== -1) {
        const length = searchString.length
        const prefix = label.substring(0, index)
        const suffix = label.substring(index + length)
        const match = label.substring(index, index + length)

        return (
          <span>
            {prefix}<Box variant="span" fontWeight="bold" display="inline">{match}</Box>{suffix}
          </span>
        )
      }
    }

    return (
      <span>{label}</span>
    )
  }

  const OPTIONS = data.onrr.distinct_locations

  return (
    <Autocomplete
      key={keyCount}
      id="location-select"
      disableListWrap
      inputValue={input}
      options={OPTIONS}
      ListboxComponent={ListboxComponent}
      getOptionLabel={option => option.location_name}
      style={{ width: '100%', maxWidth: 250 }}
      renderInput={params => (
        <TextField
          {...params}
          label="Search locations..."
          variant="outlined"
          fullWidth
          onChange={handleSearch}
        />
      )}
      renderOption={option => renderLabel(option.location_name)}
      onChange={(e, v) => handleChange(v)}
      popupIcon={<KeyboardArrowDown className="MuiSvgIcon-root MuiSelect-icon" />}
      classes={{
        inputRoot: classes.autoCompleteRoot,
        focused: classes.autoCompleteFocused,
      }}
      size="small"
    />
  )
}

export default SearchLocationsInput